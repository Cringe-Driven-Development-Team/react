import type { ReactElement } from "@maninthecoat/react";
import type { HeaderTitleProps } from "./types.ts";

export function HeaderTitle({
	total,
	completed,
	renderCount,
}: HeaderTitleProps): ReactElement {
	return (
		<>
			<h1>subtree flags todo</h1>
			<p class="subtitle">
				{total} total, {completed} completed
			</p>
			<p class="render-status">renders: {renderCount}</p>
		</>
	);
}
