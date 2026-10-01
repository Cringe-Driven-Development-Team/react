import { useContext, type ReactElement } from "@maninthecoat/react";
import { ThemeContext } from "./theme.ts";

let outerReaderRenders = 0;
let innerReaderRenders = 0;

export const nestedProviderDemoFixture: ReactElement = <NestedProviderDemo />;

function NestedProviderDemo(): ReactElement {
    return (
        <section class="nested-provider-demo">
            <div>
                <h2>Nested Provider boundary</h2>
                <p class="nested-provider-copy">
                    Outer theme updates should not mark consumers inside an inner Provider for the same
                    context.
                </p>
            </div>
            <div class="nested-provider-grid">
                <OuterThemeReader />
                <ThemeContext value="dark">
                    <InnerThemeReader />
                </ThemeContext>
            </div>
        </section>
    );
}

function OuterThemeReader(): ReactElement {
    outerReaderRenders += 1;
    const theme = useContext(ThemeContext);

    return (
        <article class="nested-provider-card outer">
            <strong>Outer consumer</strong>
            <span>theme: {theme}</span>
            <span>renders: {outerReaderRenders}</span>
        </article>
    );
}

function InnerThemeReader(): ReactElement {
    innerReaderRenders += 1;
    const theme = useContext(ThemeContext);

    return (
        <article class="nested-provider-card inner">
            <strong>Inner consumer</strong>
            <span>theme: {theme}</span>
            <span>renders: {innerReaderRenders}</span>
        </article>
    );
}
