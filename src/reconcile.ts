import type { Key, ReactElement } from "./types/element.ts";
import { FiberFlags, FiberTag, type Fiber, type QueueDeletion } from "./types/fiber.ts";
import { createFiberFromElement, createWorkInProgressFiber } from "./fiber-pair.ts";

type KeyedNode = {
	key: Key | null;
};

export function reconcileChildren(
	wipFiberNode: Fiber,
	elements: ReactElement[],
	queueDeletion: QueueDeletion,
): void {
	let index = 0;
	let lastPlacedIndex = 0;
	let prevSibling: Fiber | null = null;
	const shouldTrackSideEffects =
		wipFiberNode.tag === FiberTag.ROOT || wipFiberNode.alternate !== null;
	warnOnDuplicateKeys(elements);
	const { keyedFibers, unkeyedFibers } = collectOldFibers(wipFiberNode.alternate?.child ?? null);

	while (index < elements.length) {
		const element = elements[index];
		if (!element) {
			index += 1;
			continue;
		}

		const oldFiber = takeMatchingOldFiber(
			wipFiberNode,
			element,
			keyedFibers,
			unkeyedFibers,
			queueDeletion,
		);
		let newFiber: Fiber | null = null;

		if (oldFiber) {
			const oldIndex = oldFiber.index;

			newFiber = createWorkInProgressFiber(
				oldFiber,
				element,
				wipFiberNode,
				index,
				getMoveFlags(oldIndex, lastPlacedIndex),
			);

			lastPlacedIndex = Math.max(lastPlacedIndex, oldIndex);
		} else {
			newFiber = createFiberFromElement(
				element,
				wipFiberNode,
				index,
				shouldTrackSideEffects ? FiberFlags.PLACEMENT : FiberFlags.NO_FLAGS,
			);
		}

		if (prevSibling) {
			prevSibling.sibling = newFiber;
		} else {
			wipFiberNode.child = newFiber;
		}

		prevSibling = newFiber;
		index += 1;
	}

	queueRemainingDeletions(wipFiberNode, keyedFibers, unkeyedFibers, queueDeletion);
}

function collectOldFibers(firstOldFiber: Fiber | null): {
	keyedFibers: Map<Key, Fiber[]>;
	unkeyedFibers: Fiber[];
} {
	const keyedFibers = new Map<Key, Fiber[]>();
	const unkeyedFibers: Fiber[] = [];
	let oldFiber = firstOldFiber;

	while (oldFiber) {
		const key = getKey(oldFiber);

		if (key === null) {
			unkeyedFibers.push(oldFiber);
		} else {
			const fibers = keyedFibers.get(key) ?? [];
			fibers.push(oldFiber);
			keyedFibers.set(key, fibers);
		}

		oldFiber = oldFiber.sibling;
	}

	return { keyedFibers, unkeyedFibers };
}

function takeMatchingOldFiber(
	parent: Fiber,
	element: ReactElement,
	keyedFibers: Map<Key, Fiber[]>,
	unkeyedFibers: Fiber[],
	queueDeletion: QueueDeletion,
): Fiber | null {
	const key = getKey(element);

	if (key !== null) {
		const fibers = keyedFibers.get(key);
		if (!fibers) {
			return null;
		}

		const matchedFiber = fibers.find((oldFiber) => isSameElementType(oldFiber, element));
		if (!matchedFiber) {
			return null;
		}

		fibers.splice(fibers.indexOf(matchedFiber), 1);

		if (fibers.length === 0) {
			keyedFibers.delete(key);
		}

		return matchedFiber;
	}

	const oldFiber = unkeyedFibers.shift();
	if (!oldFiber) {
		return null;
	}

	if (!isSameElementType(oldFiber, element)) {
		queueDeletion(parent, oldFiber);
		return null;
	}

	return oldFiber;
}

function queueRemainingDeletions(
	parent: Fiber,
	keyedFibers: Map<Key, Fiber[]>,
	unkeyedFibers: Fiber[],
	queueDeletion: QueueDeletion,
): void {
	unkeyedFibers.forEach((oldFiber) => queueDeletion(parent, oldFiber));
	keyedFibers.forEach((fibers) => fibers.forEach((oldFiber) => queueDeletion(parent, oldFiber)));
}

function getKey(node: KeyedNode): Key | null {
	return node.key;
}

function warnOnDuplicateKeys(elements: ReactElement[]): void {
	const keys = new Set<Key>();

	elements.forEach((element) => {
		const key = getKey(element);
		if (key === null) {
			return;
		}

		if (keys.has(key)) {
			warnDuplicateKey(key);
			return;
		}

		keys.add(key);
	});
}

function warnDuplicateKey(key: Key): void {
	console.warn(
		`Encountered two children with the same key "${String(key)}". Keys should be unique among siblings.`,
	);
}

function isSameElementType(previous: Fiber, next: ReactElement): boolean {
	return previous.type === next.type;
}

function getMoveFlags(oldIndex: number, lastPlacedIndex: number): FiberFlags {
	return oldIndex < lastPlacedIndex ? FiberFlags.MOVE : FiberFlags.NO_FLAGS;
}
