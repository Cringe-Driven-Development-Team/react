import type { Fiber, FiberRoot } from "./types/fiber.ts";

type SchedulerConfig = {
	performUnitOfWork: (fiber: Fiber) => Fiber | null;
	commitRoot: (root: FiberRoot) => void;
};

const WORK_SLICE_MS = 5;

const pendingRoots: FiberRoot[] = [];
let config: SchedulerConfig | null = null;
let isWorkLoopScheduled = false;

const workLoopChannel = new MessageChannel();
workLoopChannel.port1.onmessage = workLoop;

export function configureWorkLoop(nextConfig: SchedulerConfig): void {
	config = nextConfig;
}

export function scheduleWork(root: FiberRoot): void {
	if (!pendingRoots.includes(root)) {
		pendingRoots.push(root);
	}

	requestWorkLoop();
}

export function unscheduleWork(root: FiberRoot): void {
	const index = pendingRoots.indexOf(root);
	if (index !== -1) {
		pendingRoots.splice(index, 1);
	}
}

function workLoop(): void {
	isWorkLoopScheduled = false;

	if (!config) {
		return;
	}

	const sliceEndsAt = performance.now() + WORK_SLICE_MS;

	let root = pendingRoots[0];
	while (root) {
		while (root.nextUnitOfWork && performance.now() < sliceEndsAt) {
			const current = root.nextUnitOfWork;
			const next = config.performUnitOfWork(current);

			if (root.nextUnitOfWork === current) {
				root.nextUnitOfWork = next;
			}
		}

		if (root.nextUnitOfWork) {
			break;
		}

		unscheduleWork(root);

		config.commitRoot(root);

		if (performance.now() >= sliceEndsAt) {
			break;
		}

		root = pendingRoots[0];
	}

	if (pendingRoots.length > 0) {
		requestWorkLoop();
	}
}

function requestWorkLoop(): void {
	if (!config || isWorkLoopScheduled) {
		return;
	}

	isWorkLoopScheduled = true;
	workLoopChannel.port2.postMessage(null);
}
