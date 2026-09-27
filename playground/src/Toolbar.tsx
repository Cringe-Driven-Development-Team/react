import type { ReactElement } from "@maninthecoat/react";
import type { ToolbarProps } from "./types.ts";

export function Toolbar({ onReverse, onRotate, onSort }: ToolbarProps): ReactElement {
	return (
		<div class="actions">
			<button class="action" type="button" onClick={onReverse}>
				Reverse
			</button>
			<button class="action" type="button" onClick={onRotate}>
				Rotate
			</button>
			<button class="action" type="button" onClick={onSort}>
				Sort by key
			</button>
		</div>
	);
}
