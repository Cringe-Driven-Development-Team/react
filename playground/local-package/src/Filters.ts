import { h } from "../../src";
import type { ReactElement } from "../../src";
import type { FilterButtonProps, FiltersProps } from "./types.ts";

export function Filters({ value, onChange }: FiltersProps): ReactElement {
	return h("div", { class: "filters" }, [
		h(FilterButton, {
			active: value === "all",
			label: "All",
			value: "all",
			onChange,
		}),
		h(FilterButton, {
			active: value === "active",
			label: "Active",
			value: "active",
			onChange,
		}),
		h(FilterButton, {
			active: value === "done",
			label: "Done",
			value: "done",
			onChange,
		}),
	]);
}

function FilterButton({ active, label, value, onChange }: FilterButtonProps): ReactElement {
	return h(
		"button",
		{
			class: active ? "filter active" : "filter",
			type: "button",
			onClick: () => onChange(value),
		},
		label,
	);
}
