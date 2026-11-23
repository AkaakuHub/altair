import type {
	GrandPrixStageProgressState,
	UserGrandPrixState,
} from '../../../../../../src/state/user-grand-prix-state.ts';
import type { UserLiveState } from '../../../../../../src/state/user-live-state.ts';
import {
	type JsonRecord,
	type OfficialApiDumpEvent,
	readNumber,
	readRecord,
	readRecordArray,
} from '../official-data-migration-dump.ts';
import { isSuccessfulOfficialDataMigrationResponse } from './official-data-migration-apply-events.ts';
import { upsertByNumberKey } from './official-data-migration-apply-upsert-list.ts';

export function applyGrandPrixProgress(
	live: UserLiveState,
	events: readonly OfficialApiDumpEvent[],
): boolean {
	const grandPrixes = events
		.filter(
			isSuccessfulOfficialDataMigrationResponse(
				'/v1/out_quest_live/grand_prix/get_stage_select',
			),
		)
		.map(createGrandPrixProgress)
		.filter((grandPrix): grandPrix is UserGrandPrixState => grandPrix !== null);
	if (grandPrixes.length === 0) {
		return false;
	}
	live.grandPrixes = upsertByNumberKey(
		live.grandPrixes,
		grandPrixes,
		(grandPrix) => grandPrix.grandPrixId,
	);
	return true;
}

function createGrandPrixProgress(
	event: OfficialApiDumpEvent,
): UserGrandPrixState | null {
	const grandPrix = readRecord(event.response?.grand_prix);
	const grandPrixId =
		readNumber(event.response?.grand_prix_id) ??
		readNumber(grandPrix?.id) ??
		readNumber(grandPrix?.grand_prix_id);
	if (grandPrixId === null) {
		return null;
	}
	return {
		grandPrixId,
		stageProgressList: readRecordArray(event.response?.stage_list)
			.map(createGrandPrixStageProgress)
			.filter(
				(progress): progress is GrandPrixStageProgressState =>
					progress !== null,
			),
	};
}

function createGrandPrixStageProgress(
	stage: JsonRecord,
): GrandPrixStageProgressState | null {
	const stageId = readNumber(stage.stage_id);
	if (stageId === null) {
		return null;
	}
	return {
		stageId,
		highScore: readNumber(stage.high_score) ?? 0,
		dailyBestScore: readNumber(stage.daily_best_score) ?? 0,
		playCount: readNumber(stage.play_count) ?? 0,
	};
}
