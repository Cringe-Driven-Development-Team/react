import { memo, useLayoutEffect, useState } from "@maninthecoat/react";
import type { ReactElement } from "@maninthecoat/react";
import type { MemoCardProps } from "./types.ts";

let memoizedCardRenders = 0;

const MemoizedCard = memo(function MemoizedCard({ label }: MemoCardProps): ReactElement {
	useLayoutEffect(() => {
		memoizedCardRenders += 1;
		writeRenderCount(memoizedCardRenders);
	});

	return (
		<article class="memo-card">
			<strong>Memoized</strong>
			<span>label: {label}</span>
			<span class="memo-count">renders: 0</span>
			<span>memo + primitive props - bails out while the label stays the same</span>
		</article>
	);
});

function writeRenderCount(count: number): void {
	const node = document.querySelector(".memo-count");

	if (node instanceof HTMLElement) {
		node.textContent = `renders: ${count}`;
	}
}

export function Memoized(): ReactElement {
	const [tick, setTick] = useState(0);
	const [label, setLabel] = useState<"green" | "blue">("green");

	function handleTick(): void {
		setTick((value) => value + 1);
	}

	function handleChangeLabel(): void {
		setLabel((value) => (value === "green" ? "blue" : "green"));
	}

	return (
		<section class="memo-lab">
			<div>
				<h2>Memoization</h2>
				<p class="memo-copy">
					parent tick: {tick}; card label: {label}
				</p>
			</div>
			<MemoizedCard label={label} />
			<div class="memo-actions">
				<button class="action" type="button" onClick={handleTick}>
					Тик
				</button>
				<button class="action" type="button" onClick={handleChangeLabel}>
					Сменить подпись
				</button>
			</div>
		</section>
	);
}
