import type { ServerState } from '../../../../../../src/server-state-schema.ts';
import { ensureUserLiveState } from '../../../../../../src/state/user-live-state.ts';
import type { OfficialDataMigrationDump } from '../official-data-migration-dump.ts';
import {
	applyGradeChallengeProgress,
	applyGradeQuestProgress,
} from './official-data-migration-apply-grade.ts';
import { applyGrandPrixProgress } from './official-data-migration-apply-grand-prix.ts';
import {
	applyDreamLiveProgress,
	applyLearningMusicMasteries,
	applyStandardQuestProgress,
} from './official-data-migration-apply-quest.ts';
import {
	applyRhythmGameGrandPrix,
	applyRhythmGameHome,
} from './official-data-migration-apply-rhythm-game.ts';

export function applyUserLiveFromDump(
	state: ServerState,
	playerId: string,
	dump: OfficialDataMigrationDump,
	database: Database,
): boolean {
	const live = ensureUserLiveState(state, playerId).value;
	let applied = false;
	applied = applyStandardQuestProgress(live, dump.events) || applied;
	applied = applyGradeQuestProgress(live, dump.events) || applied;
	applied = applyGradeChallengeProgress(live, dump.events) || applied;
	applied = applyGrandPrixProgress(live, dump.events) || applied;
	applied = applyLearningMusicMasteries(live, dump.events) || applied;
	applied = applyDreamLiveProgress(live, dump.events) || applied;
	applied = applyRhythmGameHome(live, dump.events) || applied;
	applied =
		applyRhythmGameGrandPrix(state, live, dump.events, database) || applied;
	return applied;
}

import type { Database } from 'bun:sqlite';
