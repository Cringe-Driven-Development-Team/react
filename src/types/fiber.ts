import type { ComponentProps, FunctionComponent, MemoComponent } from "./component.ts";
import type { ReactElementType, Key, ReactElement } from "./element.ts";
import type { Hook } from "./hooks.ts";

export const FiberFlags = {
	NO_FLAGS: 0,
	PLACEMENT: 1 << 0,
	UPDATE: 1 << 1,
	CHILD_DELETION: 1 << 2,
	MOVE: 1 << 3,
	LAYOUT: 1 << 4,
	PASSIVE: 1 << 5,
} as const;

export type FiberFlags = number;

export const MutationMask =
	FiberFlags.PLACEMENT | FiberFlags.UPDATE | FiberFlags.CHILD_DELETION | FiberFlags.MOVE;

export const LayoutMask = FiberFlags.LAYOUT;
export const PassiveMask = FiberFlags.PASSIVE;

export const FiberTag = {
	ROOT: "root",
	HOST: "host",
	TEXT: "text",
	FRAGMENT: "fragment",
	FUNCTION_COMPONENT: "function-component",
	MEMO_COMPONENT: "memo-component",
} as const;

export type FiberTag = (typeof FiberTag)[keyof typeof FiberTag];

export interface FiberRoot {
	container: Element;
	currentRoot: Fiber | null;
	wipRoot: Fiber | null;
	nextUnitOfWork: Fiber | null;
	isUnmounted: boolean;
}

export interface Fiber<Props extends ComponentProps = ComponentProps> {
	tag: FiberTag;
	type: ReactElementType;
	key: Key | null;
	props: Props & {
		children: ReactElement[];
	};
	dom: Node | null;
	index: number;
	parent: Fiber | null;
	child: Fiber | null;
	sibling: Fiber | null;
	alternate: Fiber | null;
	deletions: Fiber[] | null;
	flags: FiberFlags;
	subtreeFlags: FiberFlags;
	hooks?: Hook[];
	dirty: boolean;
	hasDirtySubtree: boolean;
	didBailout?: boolean;
	root?: FiberRoot;
}

export type FunctionComponentFiber = Fiber & {
	tag: typeof FiberTag.FUNCTION_COMPONENT;
	type: FunctionComponent;
};

export type MemoComponentFiber = Fiber & {
	tag: typeof FiberTag.MEMO_COMPONENT;
	type: MemoComponent;
};

export type QueueDeletion = (parent: Fiber, fiber: Fiber) => void;
