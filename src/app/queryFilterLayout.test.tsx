import { ProTable } from "@ant-design/pro-components";
import {
	act,
	fireEvent,
	render,
	renderHook,
	screen,
	waitFor,
} from "@testing-library/react";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import { describe, expect, it, vi } from "vitest";

import { useQuerySubmission } from "./queryFilterLayout";

it("native ProTable marks initial submission and removes the marker on first reset", async () => {
	const request = vi.fn(() =>
		Promise.resolve({ data: [], success: true, total: 0 }),
	);
	const beforeSearchSubmit = vi.fn((values: Record<string, unknown>) => values);
	render(
		<ConfigProvider locale={zhCN}>
			<ProTable<{ id: string }, { q?: string }>
				columns={[{ title: "Name", dataIndex: "q", key: "q" }]}
				rowKey="id"
				request={request}
				beforeSearchSubmit={beforeSearchSubmit}
				options={false}
			/>
		</ConfigProvider>,
	);
	await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
	expect(beforeSearchSubmit.mock.lastCall?.[0]._timestamp).toEqual(
		expect.any(Number),
	);
	const reset = screen.getByText(/重\s*置/);
	fireEvent.click(reset);
	await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
	const resetParams = beforeSearchSubmit.mock.lastCall?.[0];
	expect(resetParams).not.toHaveProperty("_timestamp");
	fireEvent.click(reset);
	expect(beforeSearchSubmit.mock.lastCall?.[0]).toEqual(resetParams);
	expect(request).toHaveBeenCalledTimes(2);
	fireEvent.click(screen.getByText(/查\s*询/));
	await waitFor(() => expect(request).toHaveBeenCalledTimes(3));
	expect(beforeSearchSubmit.mock.lastCall?.[0]._timestamp).toEqual(
		expect.any(Number),
	);
	fireEvent.click(reset);
	await waitFor(() => expect(request).toHaveBeenCalledTimes(4));
});

describe("useQuerySubmission", () => {
	it("creates a new query revision for every explicit query submission", () => {
		const { result } = renderHook(() => useQuerySubmission());

		const initial = result.current.revision;
		act(() => result.current.submit());
		expect(result.current.revision.submission).toBeGreaterThan(
			initial.submission,
		);
		const submitted = result.current.revision;
		act(() => {
			result.current.submit();
			result.current.submit();
		});
		expect(result.current.revision.submission).toBeGreaterThan(
			submitted.submission,
		);
	});

	it("changes the initial revision on reset and keeps repeated resets stable", () => {
		const { result } = renderHook(() => useQuerySubmission());
		const initial = result.current.revision;
		act(() => result.current.reset());
		expect(result.current.revision).not.toEqual(initial);
		const reset = result.current.revision;
		act(() => {
			result.current.reset();
			result.current.reset();
		});
		expect(result.current.revision).toBe(reset);
		act(() => result.current.submit());
		const submitted = result.current.revision;
		act(() => result.current.reset());
		expect(result.current.revision).not.toEqual(submitted);
		expect(result.current.revision).not.toEqual(reset);
	});
});
