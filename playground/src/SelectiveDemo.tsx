import { useEffect, useLayoutEffect, useState } from "@maninthecoat/react";
import type { ReactElement } from "@maninthecoat/react";

let selectiveDemoRenders = 0;
let localCounterRenders = 0;
let quietPanelRenders = 0;

export function SelectiveDemo(): ReactElement {
	selectiveDemoRenders += 1;

	return (
		<section class="selective-demo">
			<div>
				<h2>Subtree flags</h2>
				<p class="selective-copy">
					SelectiveDemo renders: {selectiveDemoRenders}; clean branches skip commit/effect
					work
				</p>
			</div>
			<div class="selective-grid">
				<LocalCounter />
				<QuietPanel />
			</div>
		</section>
	);
}

function LocalCounter(): ReactElement {
	localCounterRenders += 1;
	const [count, setCount] = useState(0);

	useLayoutEffect(() => {
		console.log(`layout effect for dirty counter: ${count}`);
	}, [count]);

	useEffect(() => {
		console.log(`passive effect for dirty counter: ${count}`);
	}, [count]);

	return (
		<article class="selective-card hot">
			<strong>Dirty component</strong>
			<span>local state: {count}</span>
			<span>renders: {localCounterRenders}</span>
			<span>has layout/passive effects</span>
			<button
				class="primary"
				type="button"
				onClick={() => setCount((value) => value + 1)}
			>
				Increment local state
			</button>
		</article>
	);
}

function QuietPanel(): ReactElement {
	quietPanelRenders += 1;

	return (
		<article class="selective-card cold">
			<strong>Clean sibling</strong>
			<span>renders: {quietPanelRenders}</span>
			<span>No DOM mutation or effect flags on local counter updates</span>
		</article>
	);
}
