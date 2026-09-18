import { h } from "../../src";
import type { ReactElement } from "../../src";
import type { TodoItemProps } from "./types.ts";

export function TodoItem({ todo, onToggle, onRemove }: TodoItemProps): ReactElement {
	return h("li", { class: todo.done ? "todo done" : "todo" }, [
		h("label", { class: "todo-label" }, [
			h("input", {
				checked: todo.done,
				type: "checkbox",
				onChange: () => onToggle(todo.id),
			}),
			h("span", {}, todo.text),
		]),
		h(
			"button",
			{
				class: "remove",
				type: "button",
				onClick: () => onRemove(todo.id),
			},
			"Remove",
		),
	]);
}
