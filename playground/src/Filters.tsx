import type { ReactElement } from "@maninthecoat/react";
import type { FilterButtonProps, FiltersProps } from "./types.ts";

export function Filters({ value, onChange }: FiltersProps): ReactElement {
	return (
		<div class="filters">
			<FilterButton active={value === "all"} label="All" value="all" onChange={onChange} />
			<FilterButton
				active={value === "active"}
				label="Active"
				value="active"
				onChange={onChange}
			/>
			<FilterButton active={value === "done"} label="Done" value="done" onChange={onChange} />
		</div>
	);
}

function FilterButton({ active, label, value, onChange }: FilterButtonProps): ReactElement {
	return (
		<button
			class={active ? "filter active" : "filter"}
			type="button"
			onClick={() => onChange(value)}
		>
			{label}
		</button>
	);
}
