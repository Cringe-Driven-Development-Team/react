import { h, useEffect, useLayoutEffect, useState } from "../../src";
import type { ReactElement } from "../../src";

let selectiveDemoRenders = 0;
let localCounterRenders = 0;
let quietPanelRenders = 0;

export function SelectiveDemo(): ReactElement {
    selectiveDemoRenders += 1;

    return h("section", { class: "selective-demo" }, [
        h("div", {}, [
            h("h2", {}, "Subtree flags"),
            h(
                "p",
                { class: "selective-copy" },
                `SelectiveDemo renders: ${selectiveDemoRenders}; clean branches skip commit/effect work`,
            ),
        ]),
        h("div", { class: "selective-grid" }, [h(LocalCounter, {}), h(QuietPanel, {})]),
    ]);
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

    return h("article", { class: "selective-card hot" }, [
        h("strong", {}, "Dirty component"),
        h("span", {}, `local state: ${count}`),
        h("span", {}, `renders: ${localCounterRenders}`),
        h("span", {}, "has layout/passive effects"),
        h(
            "button",
            {
                class: "primary",
                type: "button",
                onClick: () => setCount((value) => value + 1),
            },
            "Increment local state",
        ),
    ]);
}

function QuietPanel(): ReactElement {
    quietPanelRenders += 1;

    return h("article", { class: "selective-card cold" }, [
        h("strong", {}, "Clean sibling"),
        h("span", {}, `renders: ${quietPanelRenders}`),
        h("span", {}, "No DOM mutation or effect flags on local counter updates"),
    ]);
}
