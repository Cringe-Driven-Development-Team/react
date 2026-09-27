import { createRoot } from "@maninthecoat/react";
import { App } from "./App.tsx";
import "./styles.css";

const root = document.getElementById("root");

if (root) {
	createRoot(root).render(<App />);
}
