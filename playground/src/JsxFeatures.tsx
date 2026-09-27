import { Fragment, useState } from "@maninthecoat/react";
import type { ReactElement } from "@maninthecoat/react";

const terms = [
	{ id: "jsx", title: "jsx", text: "automatic runtime call" },
	{ id: "key", title: "key", text: "reconciler identity" },
];

type DownloadLinkProps = {
	id: string;
	label: string;
	download: string | boolean;
};

const links: DownloadLinkProps[] = [
	{ id: "named", label: "Download jsx.txt", download: "jsx.txt" },
	{ id: "default", label: "Download with default name", download: true },
];

function DownloadLink({ label, download }: DownloadLinkProps): ReactElement {
	return (
		<a class="action" href="data:text/plain,jsx" download={download}>
			{label}
		</a>
	);
}

export function JsxFeatures(): ReactElement {
	const [size, setSize] = useState(18);
	const [log, setLog] = useState<string[]>([]);

	function record(entry: string): void {
		setLog((previous) => [...previous.slice(-3), entry]);
	}

	return (
		<section class="jsx-features" onClickCapture={() => record("section: capture")}>
			<div>
				<h2 style={{ fontSize: size, opacity: 0.9 }}>JSX features</h2>
				<p class="jsx-copy">
					Клик увеличивает заголовок, двойной клик пишет в лог capture и dblclick.
				</p>
			</div>
			<dl class="jsx-terms">
				{terms.map((term) => (
					<Fragment key={term.id}>
						<dt>{term.title}</dt>
						<dd>{term.text}</dd>
					</Fragment>
				))}
			</dl>
			<div class="jsx-actions">
				<button
					class="action"
					type="button"
					onClick={() => setSize(size + 2)}
					onDoubleClick={() => record("dblclick")}
				>
					Bigger title
				</button>
				{links.map((link) => (
					<DownloadLink {...link} key={link.id} />
				))}
			</div>
			<p class="jsx-log">лог: {log.length > 0 ? log.join(" -> ") : "пока пусто"}</p>
		</section>
	);
}
