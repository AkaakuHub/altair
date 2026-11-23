import type {
	UserGradeChallengeSeasonProgressState,
	UserGradeChallengeStageProgressState,
} from '../../../../../../src/state/user-grade-challenge-state.ts';
import type { UserGradeQuestProgressState } from '../../../../../../src/state/user-grade-quest-state.ts';
import type { UserLiveState } from '../../../../../../src/state/user-live-state.ts';
import {
	type JsonRecord,
	type OfficialApiDumpEvent,
	readNumber,
	readRecordArray,
} from '../official-data-migration-dump.ts';
import { isSuccessfulOfficialDataMigrationResponse } from './official-data-migration-apply-events.ts';
import {
	upsertByNumberKey,
	upsertByStringKey,
} from './official-data-migration-apply-upsert-list.ts';

export function applyGradeQuestProgress(
	live: UserLiveState,
	events: readonly OfficialApiDumpEvent[],
): boolean {
	const progresses = events
		.filter(
			isSuccessfulOfficialDataMigrationResponse(
				'/v1/out_quest_live/grade/get_quest_list',
			),
		)
		.flatMap((event) => readRecordArray(event.response?.quest_season_list))
		.flatMap((season) => readRecordArray(season.quest_series_list))
		.map(createGradeQuestProgress)
		.filter(
			(progress): progress is UserGradeQuestProgressState => progress !== null,
		);
	if (progresses.length === 0) {
		return false;
	}
	live.gradeQuestProgressList = [
		...live.gradeQuestProgressList.filter(
			(progress) => progress.identityFingerprint !== undefined,
		),
		...upsertByNumberKey(
			live.gradeQuestProgressList.filter(
				(progress) => progress.identityFingerprint === undefined,
			),
			progresses,
			(progress) => progress.seriesId,
		),
	];
	return true;
}

export function applyGradeChallengeProgress(
	live: UserLiveState,
	events: readonly OfficialApiDumpEvent[],
): boolean {
	const responses = events.filter(
		isSuccessfulOfficialDataMigrationResponse(
			'/v1/out_quest_live/grade_challenge/get_quest_list',
		),
	);
	const stageProgresses = responses
		.flatMap((event) => readRecordArray(event.response?.stage_list))
		.map(createGradeChallengeStageProgress)
		.filter(
			(progress): progress is UserGradeChallengeStageProgressState =>
				progress !== null,
		);
	const seasonProgresses = responses
		.map((event) => createGradeChallengeSeasonProgress(event.response))
		.filter(
			(progress): progress is UserGradeChallengeSeasonProgressState =>
				progress !== null,
		);
	if (stageProgresses.length === 0 && seasonProgresses.length === 0) {
		return false;
	}
	live.gradeChallengeProgressList = upsertByStringKey(
		live.gradeChallengeProgressList,
		stageProgresses,
		(progress) =>
			[
				progress.gradeChalSeasonId,
				progress.stageId,
				progress.identityFingerprint?.domain ?? 'legacy',
				progress.identityFingerprint?.value ?? '',
			].join(':'),
	);
	live.gradeChallengeSeasonProgressList = upsertByStringKey(
		live.gradeChallengeSeasonProgressList,
		seasonProgresses,
		(progress) =>
			[
				progress.gradeChalSeasonId,
				progress.identityFingerprint?.domain ?? 'legacy',
				progress.identityFingerprint?.value ?? '',
			].join(':'),
	);
	return true;
}

function createGradeQuestProgress(
	series: JsonRecord,
): UserGradeQuestProgressState | null {
	const seriesId = readNumber(series.grade_quest_series_id);
	if (seriesId === null) {
		return null;
	}
	return {
		seriesId,
		clearStatus: readNumber(series.clear_status) ?? 0,
		bonusCleared: series.bonus_cleared === true,
	};
}

function createGradeChallengeStageProgress(
	stage: JsonRecord,
): UserGradeChallengeStageProgressState | null {
	const gradeChalSeasonId = readNumber(stage.grade_chal_season_id);
	const stageId = readNumber(stage.stage_id);
	const musicId = readNumber(stage.music_id);
	if (gradeChalSeasonId === null || stageId === null || musicId === null) {
		return null;
	}
	return {
		gradeChalSeasonId,
		stageId,
		musicId,
		highScore: readNumber(stage.high_score) ?? 0,
		playCount: readNumber(stage.play_count) ?? 0,
		playReport: typeof stage.play_report === 'string' ? stage.play_report : '',
	};
}

function createGradeChallengeSeasonProgress(
	response: JsonRecord | null,
): UserGradeChallengeSeasonProgressState | null {
	if (response === null) {
		return null;
	}
	const gradeChalSeasonId = readNumber(response.grade_chal_season_id);
	if (gradeChalSeasonId === null) {
		return null;
	}
	return {
		gradeChalSeasonId,
		seasonGradePoint: readNumber(response.season_grade_point) ?? 0,
	};
}
