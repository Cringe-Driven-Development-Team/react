export type ProfilerCounters = {
	unitsOfWork: number;
	componentRenders: number;
	commitVisits: number;
	updateDomCalls: number;
	scheduledUpdateCalls: number;
	scheduledRenderCalls: number;
};

function createCounters(): ProfilerCounters {
	return {
		unitsOfWork: 0,
		componentRenders: 0,
		commitVisits: 0,
		updateDomCalls: 0,
		scheduledUpdateCalls: 0,
		scheduledRenderCalls: 0,
	};
}

const counters: ProfilerCounters = createCounters();
let mark: ProfilerCounters = createCounters();

export const profiler = {
	enabled: false,

	reset(): void {
		mark = { ...counters };
	},

	read(): ProfilerCounters {
		return {
			unitsOfWork: counters.unitsOfWork - mark.unitsOfWork,
			componentRenders: counters.componentRenders - mark.componentRenders,
			commitVisits: counters.commitVisits - mark.commitVisits,
			updateDomCalls: counters.updateDomCalls - mark.updateDomCalls,
			scheduledUpdateCalls: counters.scheduledUpdateCalls - mark.scheduledUpdateCalls,
			scheduledRenderCalls: counters.scheduledRenderCalls - mark.scheduledRenderCalls,
		};
	},

	readTotal(): ProfilerCounters {
		return { ...counters };
	},
};

export function countProfilerEvent(name: keyof ProfilerCounters): void {
	if (!__PROFILE__ || !profiler.enabled) {
		return;
	}

	counters[name] += 1;
}
