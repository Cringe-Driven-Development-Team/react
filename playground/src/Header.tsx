import type { ReactElement } from "@maninthecoat/react";
import { HeaderTitle } from "./HeaderTitle.tsx";
import { StatsPanel } from "./StatsPanel.tsx";
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
	return (
		<header class="header">
			<div>
				<HeaderTitle total={total} completed={completed} renderCount={renderCount} />
				<p class="effect-status">document.title: {titleStatus}</p>
				{showStats ? <StatsPanel completed={completed} total={total} /> : null}
			</div>
			<div class="header-actions">
				<button class="secondary" type="button" onClick={onToggleStats}>
					{showStats ? "Hide stats" : "Show stats"}
				</button>
				<button class="primary" type="button" onClick={onAdd}>
					Add todo
				</button>
			</div>
		</header>
	);
}
