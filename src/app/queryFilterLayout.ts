import { useCallback, useState } from "react";

// Match the search configuration in Ant Design Pro's table-list template.
export const managementQueryLayout = { labelWidth: 120 };

interface QuerySubmissionRevision {
	submission: number;
	reset?: true;
}

export function useQuerySubmission() {
	// ProTable FormSearch marks initial/explicit submissions; reset removes that marker.
	// Retain the submission identity for Query's cache, so each submission can reset once.
	const [revision, setRevision] = useState<QuerySubmissionRevision>(() => ({
		submission: Date.now(),
	}));
	const submit = useCallback(() => {
		const timestamp = Date.now();
		setRevision((current) => ({
			submission: Math.max(timestamp, current.submission + 1),
		}));
	}, []);
	const reset = useCallback(() => {
		setRevision((current) =>
			current.reset ? current : { ...current, reset: true },
		);
	}, []);

	return { revision, submit, reset };
}
