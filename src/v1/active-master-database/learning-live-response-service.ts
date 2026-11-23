import type { Database } from 'bun:sqlite';
import { musicLevelForEarnedExperienceFromDatabase } from '../../master-data/music-levels.ts';
import type { UserCurrentQuestLiveState } from '../../state/user-current-quest-live-state.ts';
import { findUserItemByItemId } from '../../state/user-inventory-aggregate.ts';
import type { UserInventoryState } from '../../state/user-item-definition.ts';
import { consumeUserItem } from '../../state/user-item-mutation.ts';
import type { UserLearningMusicMasteryState } from '../../state/user-learning-music-state.ts';
import type { UserLiveState } from '../../state/user-live-state.ts';
import { recordUserQuestStageResult } from '../../state/user-standard-quest-progress.ts';
import { createMasterReleaseItemProvenance } from '../route-support/item-consumption.ts';
import { numberField } from './json-utils.ts';
import {
	getMusicLearningSeriesRowByMusicId,
	getMusicLearningSeriesRows,
	type MusicLearningSeriesRow,
} from './learning-live-master-query.ts';
import {
	getUserLearningMusicMastery,
	saveMasterReleaseLearningMusicMastery,
} from './learning-live-progress-mutation.ts';
import { mapMusicLearningResult } from './learning-live-response-mapper.ts';
import {
	learningCharacterBonusList,
	learningStageListFromDatabase,
	lookupLearningGainMusicExpFromDatabase,
} from './learning-stage-data.ts';

const musicPointItemId = 3009000;

export function getMusicLearningSelect(
	database: Database,
	masterReleaseId: string,
	userLive: UserLiveState,
	inventory: UserInventoryState,
) {
	const rows = getMusicLearningSeriesRows(database);
	const musicList = rows.map((row) => {
		const mastery = getUserLearningMusicMastery(
			database,
			masterReleaseId,
			userLive,
			row.music_id,
		);
		return {
			learning_live_series_id: row.series_id,
			music_id: row.music_id,
			earned_music_exp: mastery.earnedMusicExp,
			music_exp_level: mastery.musicExpLevel,
			is_mastery: mastery.isMastery,
			stage_list: learningStageListFromDatabase(
				database,
				row.series_id,
				learningStageAccess(userLive, row, mastery),
			),
		};
	});
	return {
		body: {
			music_list: musicList,
			music_point: musicPoint(inventory),
			latest_music_id: 0,
			character_bonus_list: learningCharacterBonusList(),
		},
		statusCode: 200,
	};
}

export function setMusicLearningMusic(
	database: Database,
	masterReleaseId: string,
	body: unknown,
	userLive: UserLiveState,
	inventory: UserInventoryState,
) {
	const musicId = numberField(body, 'music_id');
	const row = getMusicLearningSeriesRowByMusicId(database, musicId);
	if (!row) {
		return undefined;
	}
	const provenance = createMasterReleaseItemProvenance(
		database,
		masterReleaseId,
		musicPointItemId,
	);
	if (
		provenance === undefined ||
		!consumeUserItem(inventory, '', musicPointItemId, 1, provenance)
	) {
		return undefined;
	}
	const mastery = {
		musicId,
		musicExpLevel: 1,
		earnedMusicExp: 0,
		isMastery: true,
	};
	saveMasterReleaseLearningMusicMastery(
		database,
		masterReleaseId,
		userLive,
		mastery,
	);
	return {
		body: {
			music_info: {
				learning_live_series_id: row.series_id,
				music_id: musicId,
				earned_music_exp: mastery.earnedMusicExp,
				music_exp_level: mastery.musicExpLevel,
				is_mastery: mastery.isMastery,
				stage_list: learningStageListFromDatabase(database, row.series_id, {
					...learningStageAccess(userLive, row, mastery),
					gainMusicExpOverride: 0,
				}),
			},
			music_point: musicPoint(inventory),
		},
		statusCode: 200,
	};
}

export function getMusicLearningResult(
	database: Database,
	masterReleaseId: string,
	currentQuestLive: UserCurrentQuestLiveState,
	userLive: UserLiveState,
) {
	const before = getUserLearningMusicMastery(
		database,
		masterReleaseId,
		userLive,
		currentQuestLive.musicId,
	);
	const gainedMusicExp = lookupLearningGainMusicExpFromDatabase(
		database,
		currentQuestLive.stageId,
	);
	const beforeLevel = before.isMastery
		? musicLevelForEarnedExperienceFromDatabase(database, before.earnedMusicExp)
		: before.musicExpLevel;
	const earnedMusicExp = before.earnedMusicExp + gainedMusicExp;
	const after = {
		musicId: before.musicId,
		musicExpLevel: musicLevelForEarnedExperienceFromDatabase(
			database,
			earnedMusicExp,
		),
		earnedMusicExp,
		isMastery: before.isMastery,
	};
	recordUserQuestStageResult(
		userLive,
		currentQuestLive.questLiveType,
		currentQuestLive.stageId,
		currentQuestLive.musicId,
		currentQuestLive.score,
	);
	saveMasterReleaseLearningMusicMastery(
		database,
		masterReleaseId,
		userLive,
		after,
	);
	return mapMusicLearningResult(
		currentQuestLive,
		before,
		after,
		beforeLevel,
		gainedMusicExp,
	);
}

function learningStageAccess(
	userLive: UserLiveState,
	row: MusicLearningSeriesRow,
	mastery: UserLearningMusicMasteryState,
) {
	return {
		musicExpLevel: mastery.musicExpLevel,
		isMastery: mastery.isMastery,
		exReleaseConditionsLevel: row.ex_release_conditions_level,
		clearedStageIds: new Set(
			userLive.questStageProgressList
				.filter((progress) => progress.questLiveType === 3)
				.map((progress) => progress.stageId),
		),
	};
}

function musicPoint(inventory: UserInventoryState): number {
	return findUserItemByItemId(inventory, musicPointItemId)?.itemNum ?? 0;
}
