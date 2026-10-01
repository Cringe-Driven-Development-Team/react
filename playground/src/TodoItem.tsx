import { useContext, type ReactElement } from "@maninthecoat/react";
import { ThemeContext } from "./theme.ts";
import type { TodoItemProps } from "./types.ts";

export function TodoItem({ todo, onToggle, onRemove }: TodoItemProps): ReactElement {
	const theme = useContext(ThemeContext);
	const className = `${todo.done ? "todo done" : "todo"} theme-${theme}`;

	return (
		<li class={className}>
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
