import type { GrandPrixRuntimeState } from '../server-state-schema.ts';
import { isGrandPrixClosed } from '../state/grand-prix-runtime-status.ts';

export type CircleGrandPrixRankingMaster = {
	grandPrixId: number;
	name: string;
	month: number;
};

type CircleGrandPrixRankingMasterRepository = {
	findById: (grandPrixId: number) => CircleGrandPrixRankingMaster;
	findPrevious: (startDate: string) => CircleGrandPrixRankingMaster;
};

export function resolveCircleGrandPrixRankingMaster(
	runtime: GrandPrixRuntimeState,
	repository: CircleGrandPrixRankingMasterRepository,
	now: Date,
): CircleGrandPrixRankingMaster {
	if (
		runtime.grandPrixType === 2 &&
		(isGrandPrixClosed(runtime) || Date.parse(runtime.endDate) <= now.getTime())
	) {
		return repository.findById(runtime.activeGrandPrixId);
	}
	return repository.findPrevious(runtime.startDate);
}
