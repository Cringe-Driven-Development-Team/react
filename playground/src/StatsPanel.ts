import { h } from "../../src";
import type { ReactElement } from "../../src";
import type { StatsPanelProps } from "./types.ts";

export function StatsPanel({ completed, total }: StatsPanelProps): ReactElement {
	const active = total - completed;

	return h("aside", { class: "stats-panel" }, [
		h("span", {}, `${completed} done`),
		h("span", {}, `${active} active`),
		h("span", {}, `${total} total`),
	]);
}
