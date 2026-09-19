export type Todo = {
	id: number;
	text: string;
	done: boolean;
};

export type Filter = "all" | "active" | "done";

export type HeaderProps = {
	total: number;
	completed: number;
	titleStatus: string;
	showStats: boolean;
	renderCount: number;
	onAdd: () => void;
	onToggleStats: () => void;
};

export type HeaderTitleProps = {
	total: number;
	completed: number;
	renderCount: number;
};

export type StatsPanelProps = {
	completed: number;
	total: number;
};

export type ToolbarProps = {
	onReverse: () => void;
	onRotate: () => void;
	onSort: () => void;
};

export type FiltersProps = {
	value: Filter;
	onChange: (filter: Filter) => void;
};

export type FilterButtonProps = {
	active: boolean;
	label: string;
	value: Filter;
	onChange: (filter: Filter) => void;
};

export type TodoListProps = {
	todos: Todo[];
	onToggle: (id: number) => void;
	onRemove: (id: number) => void;
};

export type TodoItemProps = {
	todo: Todo;
	onToggle: (id: number) => void;
	onRemove: (id: number) => void;
};
