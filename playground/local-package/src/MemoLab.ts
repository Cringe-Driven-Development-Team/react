import { h, memo, useCallback, useLayoutEffect, useState } from "../../src";
import type { ReactElement } from "../../src";
import type { MemoCallbackCardProps, MemoCardProps } from "./types.ts";

let plainRenders = 0;
let memoizedRenders = 0;
let withCallbackRenders = 0;

const LABELS = ["green", "blue"] as const;

function PlainCard({ label }: MemoCardProps): ReactElement {
    useLayoutEffect(() => {
        plainRenders += 1;
        writeRenderCount("plain", plainRenders);
    });

    return h("article", { class: "memo-card" }, [
        h("strong", {}, "Plain"),
        h("span", {}, `label: ${label}`),
        h("span", { class: "memo-count memo-count-plain" }, "renders: 0"),
        h("span", {}, "no memo - rerenders with every parent render"),
    ]);
}

const MemoizedCard = memo(function MemoizedCard({ label }: MemoCardProps): ReactElement {
    useLayoutEffect(() => {
        memoizedRenders += 1;
        writeRenderCount("memoized", memoizedRenders);
    });

    return h("article", { class: "memo-card" }, [
        h("strong", {}, "Memoized"),
        h("span", {}, `label: ${label}`),
        h("span", { class: "memo-count memo-count-memoized" }, "renders: 0"),
        h("span", {}, "memo + primitive props - bails out while label stays the same"),
    ]);
});

const WithCallbackCard = memo(function WithCallbackCard({
                                                            onAction,
                                                        }: MemoCallbackCardProps): ReactElement {
    useLayoutEffect(() => {
        withCallbackRenders += 1;
        writeRenderCount("with-callback", withCallbackRenders);
    });

    return h("article", { class: "memo-card" }, [
        h("strong", {}, "WithCallback"),
        h("button", { class: "action", type: "button", onClick: onAction }, "Run action"),
        h("span", { class: "memo-count memo-count-with-callback" }, "renders: 0"),
        h("span", {}, "memo + callback prop - useless until the callback is stable"),
    ]);
});

function writeRenderCount(card: "plain" | "memoized" | "with-callback", count: number): void {
    const node = document.querySelector(`.memo-count-${card}`);

    if (node instanceof HTMLElement) {
        node.textContent = `renders: ${count}`;
    }
}

export function MemoLab(): ReactElement {
    const [tick, setTick] = useState(0);
    const [label, setLabel] = useState<(typeof LABELS)[number]>(LABELS[0]);
    const [hasStableCallback, setHasStableCallback] = useState(false);

    const stableAction = useCallback(() => {
        console.log("with-callback action fired");
    }, []);

    function unstableAction(): void {
        console.log("with-callback action fired");
    }

    const onAction = hasStableCallback ? stableAction : unstableAction;

    function handleTick(): void {
        setTick((value) => value + 1);
    }

    function handleChangeLabel(): void {
        setLabel((value) => (value === "green" ? "blue" : "green"));
    }

    function handleToggleStableCallback(): void {
        setHasStableCallback((value) => !value);
    }

    return h("section", { class: "memo-lab" }, [
        h("div", {}, [
            h("h2", {}, "Memoization"),
            h(
                "p",
                { class: "memo-copy" },
                `parent tick: ${tick}; second card label: ${label}; callback: ${
                    hasStableCallback ? "stable (useCallback)" : "unstable (new fn per render)"
                }`,
            ),
        ]),
        h("div", { class: "memo-grid" }, [
            h(PlainCard, { label }),
            h(MemoizedCard, { label }),
            h(WithCallbackCard, { onAction }),
        ]),
        h("div", { class: "memo-actions" }, [
            h("button", { class: "action", type: "button", onClick: handleTick }, "Тик"),
            h(
                "button",
                { class: "action", type: "button", onClick: handleChangeLabel },
                "Сменить подпись",
            ),
            h("label", { class: "memo-toggle" }, [
                h("input", {
                    type: "checkbox",
                    checked: hasStableCallback,
                    onChange: handleToggleStableCallback,
                }),
                "стабильный колбэк",
            ]),
        ]),
    ]);
}
