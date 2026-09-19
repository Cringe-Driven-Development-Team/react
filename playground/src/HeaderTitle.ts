import { h, hFragment } from "@maninthecoat/react";
import type { ReactElement } from "@maninthecoat/react";
import type { HeaderTitleProps } from "./types.ts";

export function HeaderTitle({
								total,
								completed,
								renderCount,
}: HeaderTitleProps): ReactElement {
	return hFragment([
		h("h1", {}, "subtree flags todo"),
		h("p", { class: "subtitle" }, `${total} total, ${completed} completed`),
		h("p", { class: "render-status" }, `renders: ${renderCount}`),
	]);
}
