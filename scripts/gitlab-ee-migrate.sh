#!/usr/bin/env bash
set -Eeuo pipefail

# GitLab EE single-node Linux package migration helper.
# References:
# - https://docs.gitlab.com/administration/backup_restore/migrate_to_new_server/
# - https://docs.gitlab.com/administration/backup_restore/restore_gitlab/
# - https://docs.gitlab.com/omnibus/settings/backups/
#
# Default mode is dry-run. Add --execute only after reading the printed plan.

readonly SCRIPT_NAME="$(basename "$0")"
readonly DEFAULT_BACKUP_DIR="/var/opt/gitlab/backups"
readonly DEFAULT_REDIS_DUMP="/var/opt/gitlab/redis/dump.rdb"
readonly CONFIG_DIR="/etc/gitlab"
readonly SECRETS_FILE="/etc/gitlab/gitlab-secrets.json"
readonly GITLAB_RB="/etc/gitlab/gitlab.rb"
readonly CI_BLOCK_MARKER_BEGIN="# BEGIN codex-gitlab-migration block-ci"
readonly CI_BLOCK_MARKER_END="# END codex-gitlab-migration block-ci"

ACTION=""
EXECUTE=0
ASSUME_YES=0
TARGET=""
BACKUP_FILE=""
CONFIG_BACKUP_FILE=""
REDIS_DUMP_FILE=""
EXPECTED_VERSION=""
GITLAB_URL=""
INCLUDE_SSH_HOST_KEYS=0
RESTORE_GITLAB_RB=0
SKIP_REDIS=0
SKIP_INTEGRITY_CHECKS=0
SKIP_MAINTENANCE_API=0
SKIP_MANUAL_QUIESCE_CONFIRM=0
MIGRATION_DIR=""

usage() {
  cat <<'USAGE'
Usage:
  sudo ./gitlab-ee-migrate.sh source-precheck
  sudo ./gitlab-ee-migrate.sh source-backup [--target user@new-host] [--include-ssh-host-keys] --execute
  sudo ./gitlab-ee-migrate.sh source-disable-after-cutover --execute
  sudo ./gitlab-ee-migrate.sh target-precheck --expected-version 18.3.1-ee
  sudo ./gitlab-ee-migrate.sh target-restore --migration-dir /path/migration-<ts> --execute
  sudo ./gitlab-ee-migrate.sh target-restore --backup-file /path/<id>_gitlab_backup.tar \
    --config-backup /path/gitlab_config_<ts>.tar [--redis-dump /path/dump.rdb] --execute
  sudo ./gitlab-ee-migrate.sh target-unblock-ci --execute

Actions:
  source-precheck
      Read-only checks on the old server.

  source-backup
      On the old server: optionally enable maintenance mode through the API,
      block new runner job requests, flush Redis to disk, create GitLab app and
      /etc/gitlab config backups, package migration files, and optionally scp
      the package to the new server.

  source-disable-after-cutover
      On the old server: disable packaged GitLab services in gitlab.rb after a
      completed backup/cutover so old and new servers do not process the same
      data. Use this only after you are committed to the migration.

  target-precheck
      Read-only checks on the new server. The installed GitLab version and type
      must exactly match the backup source version, for example 18.3.1-ee.

  target-restore
      On the new server: restore gitlab-secrets.json from the config backup,
      place the GitLab backup tarball in /var/opt/gitlab/backups, optionally
      restore Redis dump.rdb, restore the backup, and run GitLab checks.

  target-unblock-ci
      On the new server: remove this script's CI job request block from
      gitlab.rb and reconfigure GitLab.

Important:
  - This script is for GitLab EE self-managed Linux package (Omnibus),
    single-node migrations. Do not use it for Helm, Docker, source installs,
    Geo, external PostgreSQL/Redis, or multi-node topologies without adapting it.
  - Install GitLab EE on the new server first, using the exact same version and
    type as the source backup. Run gitlab-ctl reconfigure once before restore.
  - Run from the old server for source-* actions and from the new server for
    target-* actions.
  - Default is dry-run. Add --execute to make changes.
  - If changing FQDN, WebAuthn devices must be re-registered after restore.
  - Subscription/license data is normally in the GitLab database backup, but
    keep any offline license file or purchase records separately.

Options:
  --execute
      Actually make changes. Without it, commands are printed only.

  --yes
      Do not prompt for confirmations.

  --target user@host
      Copy the generated migration package to the target user's home directory.

  --backup-file PATH
      Backup tarball to restore on the target server.

  --config-backup PATH
      gitlab-ctl backup-etc tarball from the source server.

  --migration-dir PATH
      Directory unpacked from migration-<timestamp>.tgz. If provided,
      --backup-file, --config-backup, and --redis-dump are auto-detected.

  --redis-dump PATH
      Redis dump.rdb copied from the source server.

  --expected-version VERSION
      Expected GitLab version/type, such as 18.3.1-ee.

  --gitlab-url URL
      Source GitLab base URL for maintenance mode API, for example
      https://gitlab.example.com. Requires GITLAB_ADMIN_TOKEN in the environment.

  --skip-maintenance-api
      Do not call the maintenance mode API even if --gitlab-url is set.

  --include-ssh-host-keys
      Include /etc/ssh/ssh_host_* in the source migration package. These keys
      preserve SSH host identity but are sensitive.

  --restore-gitlab-rb
      Restore gitlab.rb from the config backup on target. Use only if you have
      reviewed hostname, storage, mail, object storage, and integration settings.

  --skip-redis
      Do not package or restore Redis dump.rdb.

  --skip-integrity-checks
      Skip artifacts/lfs/uploads checks after restore.

  --skip-manual-quiesce-confirm
      Skip prompt reminding you to disable Sidekiq cron and wait for jobs.
USAGE
}

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

die() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

need_root() {
  [[ "${EUID}" -eq 0 ]] || die "run as root, for example: sudo ./${SCRIPT_NAME} ${ACTION}"
}

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "required command not found: $1"
}

run() {
  if [[ "${EXECUTE}" -eq 1 ]]; then
    log "+ $*"
    "$@"
  else
    printf '[dry-run] '
    printf '%q ' "$@"
    printf '\n'
  fi
}

run_shell() {
  if [[ "${EXECUTE}" -eq 1 ]]; then
    log "+ $*"
    bash -c "$*"
  else
    printf '[dry-run] bash -c %q\n' "$*"
  fi
}

run_maintenance_api() {
  local enabled="$1"
  if [[ "${EXECUTE}" -eq 1 ]]; then
    log "+ curl --request PUT --header PRIVATE-TOKEN:<redacted> ${GITLAB_URL%/}/api/v4/application/settings?maintenance_mode=${enabled}"
    curl --fail --silent --show-error --request PUT \
      --header "PRIVATE-TOKEN:${GITLAB_ADMIN_TOKEN}" \
      "${GITLAB_URL%/}/api/v4/application/settings?maintenance_mode=${enabled}"
  else
    printf '[dry-run] curl --request PUT --header PRIVATE-TOKEN:<redacted> %s\n' \
      "${GITLAB_URL%/}/api/v4/application/settings?maintenance_mode=${enabled}"
  fi
}

confirm() {
  local message="$1"
  if [[ "${ASSUME_YES}" -eq 1 ]]; then
    log "confirmed by --yes: ${message}"
    return 0
  fi

  printf '%s\nType "YES" to continue: ' "${message}"
  local answer
  read -r answer
  [[ "${answer}" == "YES" ]] || die "confirmation not received"
}

gitlab_version() {
  if command -v gitlab-rake >/dev/null 2>&1; then
    gitlab-rake gitlab:env:info 2>/dev/null | awk -F: '/GitLab version/ {gsub(/^[ \t]+/, "", $2); print $2; exit}'
  elif command -v gitlab-rails >/dev/null 2>&1; then
    gitlab-rails runner 'puts Gitlab::VERSION' 2>/dev/null || true
  fi
}

assert_linux_package_ee() {
  need_cmd gitlab-ctl
  need_cmd gitlab-backup
  need_cmd gitlab-rake

  local version
  version="$(gitlab_version || true)"
  [[ -n "${version}" ]] || die "could not determine GitLab version"
  [[ "${version}" == *"-ee" ]] || die "installed GitLab does not look like EE: ${version}"

  if [[ -n "${EXPECTED_VERSION}" && "${version}" != "${EXPECTED_VERSION}" ]]; then
    die "GitLab version mismatch. Installed: ${version}; expected: ${EXPECTED_VERSION}"
  fi

  log "GitLab version: ${version}"
}

source_precheck() {
  need_root
  assert_linux_package_ee
  [[ -f "${GITLAB_RB}" ]] || die "missing ${GITLAB_RB}"
  [[ -f "${SECRETS_FILE}" ]] || die "missing ${SECRETS_FILE}; restore will not be reliable without it"
  [[ -d "${DEFAULT_BACKUP_DIR}" ]] || die "missing ${DEFAULT_BACKUP_DIR}"
  [[ -S "/var/opt/gitlab/redis/redis.socket" ]] || log "warning: Redis socket not found at /var/opt/gitlab/redis/redis.socket"
  gitlab-ctl status || true
  log "source precheck complete"
}

target_precheck() {
  need_root
  assert_linux_package_ee
  [[ -d "${DEFAULT_BACKUP_DIR}" ]] || die "missing ${DEFAULT_BACKUP_DIR}"
  [[ -f "${GITLAB_RB}" ]] || die "missing ${GITLAB_RB}; install and run gitlab-ctl reconfigure first"
  gitlab-ctl status || true
  log "target precheck complete"
}

set_maintenance_mode() {
  local enabled="$1"
  [[ "${SKIP_MAINTENANCE_API}" -eq 0 ]] || return 0
  [[ -n "${GITLAB_URL}" ]] || return 0
  [[ -n "${GITLAB_ADMIN_TOKEN:-}" ]] || die "GITLAB_ADMIN_TOKEN is required when --gitlab-url is used"

  need_cmd curl
  run_maintenance_api "${enabled}"
}

block_ci_jobs() {
  local block
  block="$(cat <<'BLOCK'

# BEGIN codex-gitlab-migration block-ci
nginx['custom_gitlab_server_config'] = "location = /api/v4/jobs/request {\n    deny all;\n    return 503;\n  }\n"
# END codex-gitlab-migration block-ci
BLOCK
)"

  if grep -qF "${CI_BLOCK_MARKER_BEGIN}" "${GITLAB_RB}"; then
    log "CI job request block already present in ${GITLAB_RB}"
    return 0
  fi

  run cp -a "${GITLAB_RB}" "${GITLAB_RB}.pre-migration.$(date +%Y%m%d%H%M%S)"
  if [[ "${EXECUTE}" -eq 1 ]]; then
    printf '%s\n' "${block}" >>"${GITLAB_RB}"
  else
    printf '[dry-run] append CI job request block to %s\n' "${GITLAB_RB}"
  fi
  run gitlab-ctl reconfigure
}

remove_ci_block() {
  [[ -f "${GITLAB_RB}" ]] || die "missing ${GITLAB_RB}"
  if ! grep -qF "${CI_BLOCK_MARKER_BEGIN}" "${GITLAB_RB}"; then
    log "CI job request block not present in ${GITLAB_RB}"
    return 0
  fi

  run cp -a "${GITLAB_RB}" "${GITLAB_RB}.pre-unblock.$(date +%Y%m%d%H%M%S)"
  if [[ "${EXECUTE}" -eq 1 ]]; then
    awk -v begin="${CI_BLOCK_MARKER_BEGIN}" -v end="${CI_BLOCK_MARKER_END}" '
      index($0, begin) {skip=1; next}
      index($0, end) {skip=0; next}
      !skip {print}
    ' "${GITLAB_RB}" >"${GITLAB_RB}.tmp"
    install -o root -g root -m 0600 "${GITLAB_RB}.tmp" "${GITLAB_RB}"
    rm -f "${GITLAB_RB}.tmp"
  else
    printf '[dry-run] remove CI job request block from %s\n' "${GITLAB_RB}"
  fi
  run gitlab-ctl reconfigure
}

latest_file() {
  local pattern="$1"
  local found
  found="$(ls -1t ${pattern} 2>/dev/null | head -n 1 || true)"
  [[ -n "${found}" ]] || die "no file found for pattern: ${pattern}"
  printf '%s\n' "${found}"
}

backup_id_from_file() {
  local file="$1"
  basename "${file}" | sed 's/_gitlab_backup\.tar$//'
}

source_backup() {
  need_root
  source_precheck

  if [[ "${SKIP_MANUAL_QUIESCE_CONFIRM}" -eq 0 ]]; then
    confirm "Before continuing, enable a maintenance window, disable Sidekiq periodic jobs in Admin > Monitoring > Background jobs > Cron, and wait for running CI/Sidekiq work to drain. This script will block new runner job requests and create backups."
  fi

  set_maintenance_mode true
  block_ci_jobs

  if [[ "${SKIP_REDIS}" -eq 0 ]]; then
    run /opt/gitlab/embedded/bin/redis-cli -s /var/opt/gitlab/redis/redis.socket save
  fi

  run gitlab-ctl stop
  run gitlab-ctl start postgresql
  run gitlab-ctl start gitaly
  run gitlab-backup create
  run gitlab-ctl backup-etc

  local ts package_dir app_backup config_backup manifest
  ts="$(date +%Y%m%d%H%M%S)"
  package_dir="${DEFAULT_BACKUP_DIR}/migration-${ts}"
  app_backup="$(latest_file "${DEFAULT_BACKUP_DIR}/*_gitlab_backup.tar")"
  config_backup="$(latest_file "${CONFIG_DIR}/config_backup/gitlab_config_*.tar")"
  manifest="${package_dir}/MANIFEST.txt"

  run mkdir -p "${package_dir}"
  run cp -a "${app_backup}" "${package_dir}/"
  run cp -a "${config_backup}" "${package_dir}/"
  if [[ "${SKIP_REDIS}" -eq 0 && -f "${DEFAULT_REDIS_DUMP}" ]]; then
    run cp -a "${DEFAULT_REDIS_DUMP}" "${package_dir}/dump.rdb"
  fi
  if [[ "${INCLUDE_SSH_HOST_KEYS}" -eq 1 ]]; then
    run_shell "cp -a /etc/ssh/ssh_host_* '${package_dir}/'"
  fi

  if [[ "${EXECUTE}" -eq 1 ]]; then
    {
      printf 'created_at=%s\n' "$(date -Iseconds)"
      printf 'gitlab_version=%s\n' "$(gitlab_version)"
      printf 'app_backup=%s\n' "$(basename "${app_backup}")"
      printf 'config_backup=%s\n' "$(basename "${config_backup}")"
      printf 'redis_dump=%s\n' "$([[ -f "${package_dir}/dump.rdb" ]] && echo dump.rdb || echo skipped)"
      printf 'restore_backup_id=%s\n' "$(backup_id_from_file "${app_backup}")"
      printf '\nsha256:\n'
      cd "${package_dir}" && sha256sum ./* 2>/dev/null
    } >"${manifest}"
  else
    printf '[dry-run] write manifest to %s\n' "${manifest}"
  fi

  run tar -C "${DEFAULT_BACKUP_DIR}" -czf "${DEFAULT_BACKUP_DIR}/migration-${ts}.tgz" "migration-${ts}"

  if [[ -n "${TARGET}" ]]; then
    run scp "${DEFAULT_BACKUP_DIR}/migration-${ts}.tgz" "${TARGET}:~/"
  fi

  run gitlab-ctl stop
  log "source backup package: ${DEFAULT_BACKUP_DIR}/migration-${ts}.tgz"
  log "keep the source server stopped or disabled until cutover is complete"
}

disable_source_after_cutover() {
  need_root
  [[ -f "${GITLAB_RB}" ]] || die "missing ${GITLAB_RB}"
  confirm "This disables packaged GitLab services on the source server and reconfigures GitLab. Use only after the final backup is complete and you are cutting over to the new server."

  local block
  block="$(cat <<'BLOCK'

# BEGIN codex-gitlab-migration disable-source-services
alertmanager['enable'] = false
gitaly['enable'] = false
gitlab_exporter['enable'] = false
gitlab_pages['enable'] = false
gitlab_workhorse['enable'] = false
logrotate['enable'] = false
gitlab_rails['incoming_email_enabled'] = false
nginx['enable'] = false
node_exporter['enable'] = false
postgres_exporter['enable'] = false
postgresql['enable'] = false
prometheus['enable'] = false
puma['enable'] = false
redis['enable'] = false
redis_exporter['enable'] = false
registry['enable'] = false
sidekiq['enable'] = false
# END codex-gitlab-migration disable-source-services
BLOCK
)"

  if grep -qF "# BEGIN codex-gitlab-migration disable-source-services" "${GITLAB_RB}"; then
    log "source services disable block already present"
  else
    run cp -a "${GITLAB_RB}" "${GITLAB_RB}.pre-disable-source.$(date +%Y%m%d%H%M%S)"
    if [[ "${EXECUTE}" -eq 1 ]]; then
      printf '%s\n' "${block}" >>"${GITLAB_RB}"
    else
      printf '[dry-run] append source disable block to %s\n' "${GITLAB_RB}"
    fi
  fi

  run gitlab-ctl reconfigure
  run gitlab-ctl status
}

extract_from_config_backup() {
  local tarball="$1"
  local source_path="$2"
  local dest_path="$3"
  local mode="$4"

  [[ -f "${tarball}" ]] || die "missing config backup: ${tarball}"

  local member
  member="$(tar -tf "${tarball}" | grep -E "(^|/)${source_path#/}$" | head -n 1 || true)"
  [[ -n "${member}" ]] || die "could not find ${source_path} in ${tarball}"

  if [[ "${EXECUTE}" -eq 1 ]]; then
    tar -xOf "${tarball}" "${member}" >"${dest_path}.tmp"
    install -o root -g root -m "${mode}" "${dest_path}.tmp" "${dest_path}"
    rm -f "${dest_path}.tmp"
  else
    printf '[dry-run] extract %s from %s to %s mode %s\n' "${source_path}" "${tarball}" "${dest_path}" "${mode}"
  fi
}

target_restore() {
  need_root
  target_precheck

  if [[ -n "${MIGRATION_DIR}" ]]; then
    [[ -d "${MIGRATION_DIR}" ]] || die "migration directory not found: ${MIGRATION_DIR}"
    [[ -n "${BACKUP_FILE}" ]] || BACKUP_FILE="$(latest_file "${MIGRATION_DIR}/*_gitlab_backup.tar")"
    [[ -n "${CONFIG_BACKUP_FILE}" ]] || CONFIG_BACKUP_FILE="$(latest_file "${MIGRATION_DIR}/gitlab_config_*.tar")"
    if [[ -z "${REDIS_DUMP_FILE}" && -f "${MIGRATION_DIR}/dump.rdb" ]]; then
      REDIS_DUMP_FILE="${MIGRATION_DIR}/dump.rdb"
    fi
  fi

  [[ -n "${BACKUP_FILE}" ]] || die "--backup-file is required"
  [[ -f "${BACKUP_FILE}" ]] || die "backup file not found: ${BACKUP_FILE}"
  [[ -n "${CONFIG_BACKUP_FILE}" ]] || die "--config-backup is required to restore gitlab-secrets.json"
  [[ -f "${CONFIG_BACKUP_FILE}" ]] || die "config backup not found: ${CONFIG_BACKUP_FILE}"

  local backup_name backup_dest restore_id
  backup_name="$(basename "${BACKUP_FILE}")"
  restore_id="$(backup_id_from_file "${backup_name}")"
  [[ "${restore_id}" != "${backup_name}" ]] || die "--backup-file must end with _gitlab_backup.tar"
  backup_dest="${DEFAULT_BACKUP_DIR}/${backup_name}"

  confirm "This restore overwrites GitLab database contents on the target server. The target must be a fresh GitLab EE install with the exact same version/type as the source backup."

  extract_from_config_backup "${CONFIG_BACKUP_FILE}" "etc/gitlab/gitlab-secrets.json" "${SECRETS_FILE}" "0600"
  if [[ "${RESTORE_GITLAB_RB}" -eq 1 ]]; then
    extract_from_config_backup "${CONFIG_BACKUP_FILE}" "etc/gitlab/gitlab.rb" "${GITLAB_RB}" "0600"
  fi

  run gitlab-ctl reconfigure
  run cp -a "${BACKUP_FILE}" "${backup_dest}"
  run chown git:git "${backup_dest}"
  run chown git:root "${DEFAULT_BACKUP_DIR}"

  if [[ "${SKIP_REDIS}" -eq 0 ]]; then
    if [[ -n "${REDIS_DUMP_FILE}" ]]; then
      [[ -f "${REDIS_DUMP_FILE}" ]] || die "Redis dump not found: ${REDIS_DUMP_FILE}"
      run gitlab-ctl stop redis
      run cp -a "${REDIS_DUMP_FILE}" "${DEFAULT_REDIS_DUMP}"
      run chown gitlab-redis:gitlab-redis "${DEFAULT_REDIS_DUMP}"
      run chown gitlab-redis /var/opt/gitlab/redis
      run gitlab-ctl start redis
    else
      log "warning: --redis-dump not provided; Redis queues/sessions/cache dump will not be restored"
    fi
  fi

  run gitlab-ctl stop puma
  run gitlab-ctl stop sidekiq
  run_shell "GITLAB_ASSUME_YES=1 gitlab-backup restore BACKUP='${restore_id}'"
  run gitlab-ctl start
  run gitlab-rake gitlab:check SANITIZE=true
  run gitlab-rake gitlab:doctor:secrets

  if [[ "${SKIP_INTEGRITY_CHECKS}" -eq 0 ]]; then
    run gitlab-rake gitlab:artifacts:check
    run gitlab-rake gitlab:lfs:check
    run gitlab-rake gitlab:uploads:check
  fi

  log "target restore complete. Re-enable Sidekiq cron in the admin UI, test read/write flows, then update DNS/load balancer."
}

parse_args() {
  [[ "$#" -gt 0 ]] || {
    usage
    exit 1
  }

  if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    usage
    exit 0
  fi

  ACTION="$1"
  shift

  while [[ "$#" -gt 0 ]]; do
    case "$1" in
      --execute)
        EXECUTE=1
        shift
        ;;
      --yes)
        ASSUME_YES=1
        shift
        ;;
      --target)
        TARGET="${2:-}"
        [[ -n "${TARGET}" ]] || die "--target requires a value"
        shift 2
        ;;
      --backup-file)
        BACKUP_FILE="${2:-}"
        [[ -n "${BACKUP_FILE}" ]] || die "--backup-file requires a value"
        shift 2
        ;;
      --config-backup)
        CONFIG_BACKUP_FILE="${2:-}"
        [[ -n "${CONFIG_BACKUP_FILE}" ]] || die "--config-backup requires a value"
        shift 2
        ;;
      --migration-dir)
        MIGRATION_DIR="${2:-}"
        [[ -n "${MIGRATION_DIR}" ]] || die "--migration-dir requires a value"
        shift 2
        ;;
      --redis-dump)
        REDIS_DUMP_FILE="${2:-}"
        [[ -n "${REDIS_DUMP_FILE}" ]] || die "--redis-dump requires a value"
        shift 2
        ;;
      --expected-version)
        EXPECTED_VERSION="${2:-}"
        [[ -n "${EXPECTED_VERSION}" ]] || die "--expected-version requires a value"
        shift 2
        ;;
      --gitlab-url)
        GITLAB_URL="${2:-}"
        [[ -n "${GITLAB_URL}" ]] || die "--gitlab-url requires a value"
        shift 2
        ;;
      --include-ssh-host-keys)
        INCLUDE_SSH_HOST_KEYS=1
        shift
        ;;
      --restore-gitlab-rb)
        RESTORE_GITLAB_RB=1
        shift
        ;;
      --skip-redis)
        SKIP_REDIS=1
        shift
        ;;
      --skip-integrity-checks)
        SKIP_INTEGRITY_CHECKS=1
        shift
        ;;
      --skip-maintenance-api)
        SKIP_MAINTENANCE_API=1
        shift
        ;;
      --skip-manual-quiesce-confirm)
        SKIP_MANUAL_QUIESCE_CONFIRM=1
        shift
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        die "unknown option: $1"
        ;;
    esac
  done
}

main() {
  parse_args "$@"

  case "${ACTION}" in
    source-precheck)
      source_precheck
      ;;
    source-backup)
      source_backup
      ;;
    source-disable-after-cutover)
      disable_source_after_cutover
      ;;
    target-precheck)
      target_precheck
      ;;
    target-restore)
      target_restore
      ;;
    target-unblock-ci)
      need_root
      remove_ci_block
      ;;
    *)
      usage
      die "unknown action: ${ACTION}"
      ;;
  esac
}

main "$@"
