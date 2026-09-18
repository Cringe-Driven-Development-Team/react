import { h } from "../../src";
import type { ReactElement } from "../../src";
import { HeaderTitle } from "./HeaderTitle.ts";
import { StatsPanel } from "./StatsPanel.ts";
import type { HeaderProps } from "./types.ts";

export function Header({
	total,
	completed,
	titleStatus,
	showStats,
	renderCount,
	onAdd,
	onToggleStats,
}: HeaderProps): ReactElement {
	return h("header", { class: "header" }, [
		h("div", {}, [
			h(HeaderTitle, {
				total,
				completed,
				renderCount,
			}),
			h("p", { class: "effect-status" }, `document.title: ${titleStatus}`),
			showStats
				? h(StatsPanel, {
						completed,
						total,
					})
				: null,
		]),
		h("div", { class: "header-actions" }, [
			h("button", { class: "secondary", type: "button", onClick: onToggleStats }, [
				showStats ? "Hide stats" : "Show stats",
			]),
			h("button", { class: "primary", type: "button", onClick: onAdd }, "Add todo"),
		]),
	]);
}
