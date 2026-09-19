import { createRoot, h } from "../../src";
import { App } from "./App.ts";
import "./styles.css";

const root = document.getElementById("root");

if (root) {
	createRoot(root).render(h(App, {}));
}
