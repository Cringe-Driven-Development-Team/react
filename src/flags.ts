import { EffectKind } from "./types/hooks.ts";
import { FiberFlags, type Fiber } from "./types/fiber.ts";

export function getFlagForEffectKind(effectKind: EffectKind): FiberFlags {
	return effectKind === EffectKind.LAYOUT ? FiberFlags.LAYOUT : FiberFlags.PASSIVE;
}

export function hasFlags(flags: FiberFlags, mask: FiberFlags): boolean {
	return (flags & mask) !== FiberFlags.NO_FLAGS;
}

export function hasFiberWork(fiber: Fiber, mask: FiberFlags): boolean {
	return hasFlags(fiber.flags | fiber.subtreeFlags, mask);
}

export function bubbleSubtreeFlags(fiber: Fiber): void {
	let subtreeFlags = FiberFlags.NO_FLAGS;
	let child = fiber.child;

	while (child) {
		subtreeFlags |= child.flags | child.subtreeFlags;
		child = child.sibling;
	}

	fiber.subtreeFlags = subtreeFlags;
}
