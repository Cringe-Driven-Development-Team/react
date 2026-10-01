import {useContext, type ReactElement } from "@maninthecoat/react";
import { ThemeContext } from "./theme.ts";
import type { HeaderTitleProps } from "./types.ts";

export function HeaderTitle({
	total,
	completed,
	renderCount,
}: HeaderTitleProps): ReactElement {
	const theme = useContext(ThemeContext);

	return (
		<>
			<div class="title-row">
				<h1>context todo</h1>
				<span class={theme === "dark" ? "theme-pill dark" : "theme-pill"}>{theme}</span>
			</div>
			<p class="subtitle">
				{total} total, {completed} completed
			</p>
			<p class="render-status">renders: {renderCount}</p>
		</>
	);
}
