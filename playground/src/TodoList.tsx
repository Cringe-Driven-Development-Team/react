import type { ReactElement } from "@maninthecoat/react";
import { TodoItem } from "./TodoItem.tsx";
import type { TodoListProps } from "./types.ts";

export function TodoList({ todos, onToggle, onRemove }: TodoListProps): ReactElement {
	return (
		<ul class="list">
			{todos.length > 0
				? todos.map((todo) => (
						<TodoItem
							key={todo.id}
							todo={todo}
							onToggle={onToggle}
							onRemove={onRemove}
						/>
					))
				: <li class="empty">Nothing here</li>}
		</ul>
	);
}
