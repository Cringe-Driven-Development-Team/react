import type { ReactElement } from "@maninthecoat/react";
import type { TodoItemProps } from "./types.ts";

export function TodoItem({ todo, onToggle, onRemove }: TodoItemProps): ReactElement {
	return (
		<li class={todo.done ? "todo done" : "todo"}>
			<label class="todo-label">
				<input checked={todo.done} type="checkbox" onChange={() => onToggle(todo.id)} />
				<span>{todo.text}</span>
			</label>
			<button class="remove" type="button" onClick={() => onRemove(todo.id)}>
				Remove
			</button>
		</li>
	);
}
