import { h, useEffect, useLayoutEffect, useState } from "../../src";
import type { ReactElement } from "../../src";
import { Filters } from "./Filters.ts";
import { Header } from "./Header.ts";
import { MemoLab } from "./MemoLab.ts";
import { SelectiveDemo } from "./SelectiveDemo.ts";
import { TodoList } from "./TodoList.ts";
import { Toolbar } from "./Toolbar.ts";
import type { Filter, Todo } from "./types.ts";

const initialTodos: Todo[] = [
	{ id: 1, text: "Run effects after commit", done: true },
	{ id: 2, text: "Clean up effect before deps change", done: false },
	{ id: 3, text: "Keep state and effects across moves", done: false },
];

let nextTodoId = 4;

function createTodoId(): number {
	const id = nextTodoId;
	nextTodoId += 1;
	return id;
}

let renderCount = 0;

export function App(): ReactElement {
	const [todos, setTodos] = useState(initialTodos);
	const [filter, setFilter] = useState<Filter>("all");
	const [showStats, setShowStats] = useState(true);
	const visibleTodos = getVisibleTodos(todos, filter);
	const completedCount = todos.filter((todo) => todo.done).length;
	const titleStatus = `${completedCount}/${todos.length} completed`;

	renderCount += 1;

	useEffect(() => {
		document.title = titleStatus;
	}, [titleStatus]);

	useLayoutEffect(() => {
		const todoCount = document.querySelectorAll(".todo").length;
		console.log(`layout effect: ${todoCount} todo DOM nodes`);
	}, [visibleTodos.length]);

	useEffect(() => {
		console.log(`subscribe filter "${filter}"`);

		return () => {
			console.log(`cleanup filter "${filter}"`);
		};
	}, [filter]);

	function addTodo(): void {
		const id = createTodoId();

		setTodos((previousTodos) => [
			{
				id,
				text: `State task ${id}`,
				done: false,
			},
			...previousTodos,
		]);
	}

	function toggleTodo(id: number): void {
		setTodos((previousTodos) =>
			previousTodos.map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo)),
		);
	}

	function removeTodo(id: number): void {
		setTodos((previousTodos) => previousTodos.filter((todo) => todo.id !== id));
	}

	function reverseTodos(): void {
		setTodos((previousTodos) => [...previousTodos].reverse());
	}

	function rotateTodos(): void {
		setTodos((previousTodos) => {
			const [firstTodo, ...restTodos] = previousTodos;
			return firstTodo ? [...restTodos, firstTodo] : previousTodos;
		});
	}

	function sortTodos(): void {
		setTodos((previousTodos) => [...previousTodos].sort((left, right) => left.id - right.id));
	}

	function toggleStats(): void {
		setShowStats((visible) => !visible);
	}

	function changeFilter(nextFilter: Filter): void {
		setFilter(nextFilter);
	}

	return h("main", { class: "app" }, [
		h("section", { class: "panel" }, [
			h(Header, {
				total: todos.length,
				completed: completedCount,
				titleStatus,
				showStats,
				renderCount,
				onAdd: addTodo,
				onToggleStats: toggleStats,
			}),
			h(Toolbar, {
				onReverse: reverseTodos,
				onRotate: rotateTodos,
				onSort: sortTodos,
			}),
			h(Filters, {
				value: filter,
				onChange: changeFilter,
			}),
			h(SelectiveDemo, {}),
			h(MemoLab, {}),
			h(TodoList, {
				todos: visibleTodos,
				onToggle: toggleTodo,
				onRemove: removeTodo,
			}),
		]),
	]);
}

function getVisibleTodos(todos: Todo[], filter: Filter): Todo[] {
	if (filter === "active") {
		return todos.filter((todo) => !todo.done);
	}

	if (filter === "done") {
		return todos.filter((todo) => todo.done);
	}

	return todos;
}
