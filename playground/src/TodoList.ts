import { h } from "../../src";
import type { ReactElement } from "../../src";
import { TodoItem } from "./TodoItem.ts";
import type { TodoListProps } from "./types.ts";

export function TodoList({ todos, onToggle, onRemove }: TodoListProps): ReactElement {
	return h(
		"ul",
		{ class: "list" },
		todos.length > 0
			? todos.map((todo) =>
					h(TodoItem, {
						key: todo.id,
						todo,
						onToggle,
						onRemove,
					}),
				)
			: [h("li", { class: "empty" }, "Nothing here")],
	);
}
