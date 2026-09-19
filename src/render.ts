import type { ReactElement } from "./types/element.ts";
import type { FiberRoot } from "./types/fiber.ts";
import { configureWorkLoop, scheduleWork, unscheduleWork } from "./scheduler.ts";
import {
	commitRoot as commitRendererRoot,
	createFiberRoot,
	createRenderRoot,
	createUpdateRoot,
	getPendingCommit,
	resetFiberRoot,
} from "./renderer-state.ts";
import { performUnitOfWork } from "./fiber.ts";
import { commitRoot, commitRootUnmount } from "./commit.ts";
import { setScheduleRender } from "./hooks.ts";
import { flushPassiveEffects } from "./effects.ts";

export interface Root {
	render(element: ReactElement): void;
	unmount(): void;
}

configureWorkLoop({
	performUnitOfWork,
	commitRoot: commitPendingRoot,
});

setScheduleRender(
	(root) => {
		flushPassiveEffects();

		if (createUpdateRoot(root)) {
			scheduleWork(root);
		}
	},
	(root) => {
		if (!createUpdateRoot(root)) {
			return false;
		}

		scheduleWork(root);
		return true;
	},
);

export function createRoot(container: Element): Root {
	const fiberRoot = createFiberRoot(container);

	return {
		render(element: ReactElement): void {
			if (fiberRoot.isUnmounted) {
				throw new Error("Root.render was called on an unmounted root.");
			}

			flushPassiveEffects();
			createRenderRoot(fiberRoot, element);
			scheduleWork(fiberRoot);
		},
		unmount(): void {
			unmountRoot(fiberRoot);
		},
	};
}

function unmountRoot(root: FiberRoot): void {
	if (root.isUnmounted) {
		return;
	}

	unscheduleWork(root);

	if (root.currentRoot) {
		commitRootUnmount(root.currentRoot);
	}

	resetFiberRoot(root);
}

function commitPendingRoot(root: FiberRoot): void {
	const pendingCommit = getPendingCommit(root);
	if (!pendingCommit) {
		return;
	}

	commitRoot({
		...pendingCommit,
		onCommitted: (rootFiber) => commitRendererRoot(root, rootFiber),
	});
}
