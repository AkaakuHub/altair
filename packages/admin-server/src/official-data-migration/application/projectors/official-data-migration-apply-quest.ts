import type { UserLearningMusicMasteryState } from '../../../../../../src/state/user-learning-music-state.ts';
import type { UserLiveState } from '../../../../../../src/state/user-live-state.ts';
import type {
	UserDreamLiveProgressState,
	UserQuestStageProgressState,
} from '../../../../../../src/state/user-quest-progress-types.ts';
import {
	type JsonRecord,
	type OfficialApiDumpEvent,
	readNumber,
	readRecordArray,
} from '../official-data-migration-dump.ts';
import {
	isSuccessfulOfficialDataMigrationResponse,
	latestOfficialDataMigrationResponse,
} from './official-data-migration-apply-events.ts';
import { upsertByNumberKey } from './official-data-migration-apply-upsert-list.ts';

export function applyStandardQuestProgress(
	live: UserLiveState,
	events: readonly OfficialApiDumpEvent[],
): boolean {
	const progresses = events
		.filter(
			isSuccessfulOfficialDataMigrationResponse(
				'/v1/out_quest_live/standard/get_stage_select',
			),
		)
		.flatMap((event) => readRecordArray(event.response?.stage_list))
		.map((stage) => createQuestStageProgress(stage, 1))
		.filter(
			(progress): progress is UserQuestStageProgressState => progress !== null,
		);
	if (progresses.length === 0) return false;
	live.questStageProgressList = upsertByNumberKey(
		live.questStageProgressList,
		progresses,
		(progress) => progress.stageId,
	);
	return true;
}

export function applyLearningMusicMasteries(
	live: UserLiveState,
	events: readonly OfficialApiDumpEvent[],
): boolean {
	const masteries = events
		.filter(
			isSuccessfulOfficialDataMigrationResponse(
				'/v1/out_quest_live/music_learning/get_music_select',
			),
		)
		.flatMap((event) => readRecordArray(event.response?.music_list))
		.map(createLearningMusicMastery)
		.filter(
			(mastery): mastery is UserLearningMusicMasteryState => mastery !== null,
		);
	if (masteries.length === 0) return false;
	live.learningMusicMasteries = upsertByNumberKey(
		live.learningMusicMasteries,
		masteries,
		(mastery) => mastery.musicId,
	);
	return true;
}

export function applyDreamLiveProgress(
	live: UserLiveState,
	events: readonly OfficialApiDumpEvent[],
): boolean {
	const response = latestOfficialDataMigrationResponse(
		events,
		'/v1/out_quest_live/get_quest_top',
	);
	if (response === null) return false;
	const progresses = readRecordArray(response.dream_live_member_select)
		.map(createDreamLiveProgress)
		.filter(
			(progress): progress is UserDreamLiveProgressState => progress !== null,
		);
	if (progresses.length === 0) return false;
	live.dreamLiveProgressList = upsertByNumberKey(
		live.dreamLiveProgressList,
		progresses,
		(progress) => progress.stageId,
	);
	return true;
}

function createQuestStageProgress(
	stage: JsonRecord,
	questLiveType: number,
): UserQuestStageProgressState | null {
	const stageId = readNumber(stage.stage_id);
	if (stageId === null) return null;
	const clearStatus = readNumber(stage.clear_status) ?? 0;
	const bestLoveMusicId = readNumber(stage.best_love_music_id);
	return {
		questLiveType,
		stageId,
		highScore: readNumber(stage.best_love) ?? readNumber(stage.high_score) ?? 0,
		playCount: clearStatus > 0 ? 1 : 0,
		...(bestLoveMusicId !== null ? { bestLoveMusicId } : {}),
	};
}

function createLearningMusicMastery(
	music: JsonRecord,
): UserLearningMusicMasteryState | null {
	const musicId = readNumber(music.music_id);
	if (musicId === null) return null;
	return {
		musicId,
		musicExpLevel: readNumber(music.music_exp_level) ?? 1,
		earnedMusicExp: readNumber(music.earned_music_exp) ?? 0,
		isMastery: music.is_mastery === true,
	};
}

function createDreamLiveProgress(
	row: JsonRecord,
): UserDreamLiveProgressState | null {
	const stageId = readNumber(row.dream_quest_stages_id);
	if (stageId === null) return null;
	return {
		stageId,
		clearTimes: readNumber(row.clear_times) ?? (row.is_clear === true ? 1 : 0),
		isGetCard: row.is_get_card === true,
		limitBreakTimes: readNumber(row.limit_break_times) ?? 0,
	};
}
