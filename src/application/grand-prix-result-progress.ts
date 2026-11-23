import type { EntityIdentityFingerprint } from '../state/entity-provenance.ts';
import {
	findGrandPrixStageProgress,
	type GrandPrixStageProgressState,
	recordGrandPrixStageResult,
	type UserGrandPrixState,
} from '../state/user-grand-prix-state.ts';

export function applyGrandPrixResultProgress(input: {
	grandPrix: UserGrandPrixState;
	stageId: number;
	score: number;
	dailyScore: number;
	isRehearsal: boolean;
	identityFingerprint?: EntityIdentityFingerprint;
	sourceMasterReleaseId?: string;
}): GrandPrixStageProgressState {
	const progressBefore = findGrandPrixStageProgress(
		input.grandPrix,
		input.stageId,
		input.identityFingerprint,
	);
	if (!input.isRehearsal) {
		recordGrandPrixStageResult(
			input.grandPrix,
			input.stageId,
			input.score,
			input.dailyScore,
			input.identityFingerprint,
			input.sourceMasterReleaseId,
		);
	}
	return progressBefore;
}
