import { h } from "@maninthecoat/react";
import type { ReactElement } from "@maninthecoat/react";
import type { ToolbarProps } from "./types.ts";

export function Toolbar({ onReverse, onRotate, onSort }: ToolbarProps): ReactElement {
	return h("div", { class: "actions" }, [
		h("button", { class: "action", type: "button", onClick: onReverse }, "Reverse"),
		h("button", { class: "action", type: "button", onClick: onRotate }, "Rotate"),
		h("button", { class: "action", type: "button", onClick: onSort }, "Sort by key"),
	]);
}
