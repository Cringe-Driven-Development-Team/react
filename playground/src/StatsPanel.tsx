import type { ReactElement } from "@maninthecoat/react";
import type { StatsPanelProps } from "./types.ts";

export function StatsPanel({ completed, total }: StatsPanelProps): ReactElement {
	const active = total - completed;

	return (
		<aside class="stats-panel">
			<span>{completed} done</span>
			<span>{active} active</span>
			<span>{total} total</span>
		</aside>
	);
}
