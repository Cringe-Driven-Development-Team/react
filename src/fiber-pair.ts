import { REACT_FRAGMENT_TYPE, REACT_TEXT_TYPE } from "./symbols.ts";
import type { ReactElement } from "./types/element.ts";
import { FiberFlags, FiberTag, type Fiber } from "./types/fiber.ts";
import { isMemoComponent } from "./memo.ts";

type FiberElementInput = Pick<Fiber, "type" | "key" | "props">;

export function createFiberFromElement(
	element: ReactElement,
	parent: Fiber,
	index: number,
	flags: FiberFlags,
): Fiber {
	return {
		tag: getFiberTag(element),
		type: element.type,
		key: element.key,
		props: element.props,
		dom: null,
		index,
		parent,
		child: null,
		sibling: null,
		alternate: null,
		deletions: null,
		flags,
		subtreeFlags: FiberFlags.NO_FLAGS,
		dirty: true,
		hasDirtySubtree: false,
	};
}

export function createWorkInProgressFiber(
	current: Fiber,
	element: FiberElementInput,
	parent: Fiber,
	index: number,
	flags: FiberFlags = FiberFlags.NO_FLAGS,
): Fiber {
	const workInProgress = current.alternate ?? { ...current };

	workInProgress.tag = current.tag;
	workInProgress.type = element.type;
	workInProgress.key = element.key;
	workInProgress.props = element.props;
	workInProgress.dom = current.dom;
	workInProgress.index = index;
	workInProgress.parent = parent;
	workInProgress.child = null;
	workInProgress.sibling = null;
	workInProgress.alternate = current;
	workInProgress.deletions = null;
	workInProgress.flags = flags;
	workInProgress.subtreeFlags = 0;
	workInProgress.hooks = current.hooks;
	workInProgress.dirty = current.dirty;
	workInProgress.hasDirtySubtree = current.hasDirtySubtree;

	delete workInProgress.didBailout;

	current.alternate = workInProgress;

	return workInProgress;
}

function getFiberTag(element: ReactElement): Fiber["tag"] {
	if (typeof element.type === "function") {
		return FiberTag.FUNCTION_COMPONENT;
	}

	if (isMemoComponent(element.type)) {
		return FiberTag.MEMO_COMPONENT;
	}

	if (element.type === REACT_FRAGMENT_TYPE) {
		return FiberTag.FRAGMENT;
	}

	if (element.type === REACT_TEXT_TYPE) {
		return FiberTag.TEXT;
	}

	return FiberTag.HOST;
}
