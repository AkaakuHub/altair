import type {
	ChapterCategoryPointState,
	ChapterMissionProgressState,
	UserChapterState,
} from '../../../../../../src/state/chapter-types.ts';
import type { UserDailyQuestState } from '../../../../../../src/state/daily-quest-state.ts';
import {
	type JsonRecord,
	type OfficialApiDumpEvent,
	type OfficialDataMigrationDump,
	readNumber,
	readNumberArray,
	readRecord,
	readRecordArray,
} from '../official-data-migration-dump.ts';
import {
	isSuccessfulOfficialDataMigrationResponse,
	latestOfficialDataMigrationResponse,
} from './official-data-migration-apply-events.ts';

export function createDailyQuestFromDump(
	playerId: string,
	dump: OfficialDataMigrationDump,
): UserDailyQuestState | null {
	const stageSelectResponse = latestOfficialDataMigrationResponse(
		dump.events,
		'/v1/out_quest_live/daily/get_stage_select',
	);
	const recoveryResponse = latestOfficialDataMigrationResponse(
		dump.events,
		'/v1/out_quest_live/daily/get_recovery_challenge_count',
	);
	if (stageSelectResponse === null && recoveryResponse === null) {
		return null;
	}
	const userDailyTicketInfo = readRecord(
		stageSelectResponse?.user_daily_ticket_info,
	);
	const challengeCount = readNumber(recoveryResponse?.challenge_count);
	return {
		playerId,
		userDailyTicketInfo: {
			num:
				readNumber(userDailyTicketInfo?.num) ??
				challengeCount ??
				readRecordArray(stageSelectResponse?.stage_list).length,
			max: readNumber(userDailyTicketInfo?.max) ?? 3,
		},
		recoveryCount: readNumber(recoveryResponse?.recovery_count) ?? 0,
		recoveryGameDate: null,
		temporaryReleaseDailyQuestSeriesIdList: readNumberArray(
			stageSelectResponse?.temporary_release_daily_quest_series_id_list,
		),
	};
}

export function createChapterFromDump(
	playerId: string,
	dump: OfficialDataMigrationDump,
): UserChapterState | null {
	const homeResponse = latestOfficialDataMigrationResponse(
		dump.events,
		'/v1/chapter/home',
	);
	if (homeResponse === null) {
		return null;
	}
	const rankInfo = readRecord(homeResponse.rank_info);
	const chapter: UserChapterState = {
		playerId,
		chapterId: readNumber(homeResponse.chapter_id) ?? 0,
		currentPoint: readNumber(rankInfo?.current_point) ?? 0,
		categoryPoints: readRecordArray(homeResponse.category_list)
			.map(createChapterCategoryPoint)
			.filter(
				(category): category is ChapterCategoryPointState => category !== null,
			),
		missionProgresses: [],
		claimedPointRewardIds: [],
	};
	chapter.missionProgresses = collectChapterMissionProgresses(dump.events);
	chapter.claimedPointRewardIds = collectClaimedChapterPointRewardIds(
		dump.events,
	);
	return chapter;
}

function createChapterCategoryPoint(
	category: JsonRecord,
): ChapterCategoryPointState | null {
	const categoryId = readNumber(category.category_id);
	if (categoryId === null) {
		return null;
	}
	return {
		categoryId,
		currentPoint: readNumber(category.current_point) ?? 0,
	};
}

function collectChapterMissionProgresses(
	events: readonly OfficialApiDumpEvent[],
): ChapterMissionProgressState[] {
	return events
		.filter(
			isSuccessfulOfficialDataMigrationResponse('/v1/chapter/category_info'),
		)
		.flatMap((event) => readRecordArray(event.response?.mission_list))
		.map(createChapterMissionProgress)
		.filter(
			(progress): progress is ChapterMissionProgressState => progress !== null,
		);
}

function createChapterMissionProgress(
	mission: JsonRecord,
): ChapterMissionProgressState | null {
	const missionId = readNumber(mission.mission_id);
	if (missionId === null) {
		return null;
	}
	const status = readNumber(mission.status);
	return {
		missionId,
		achievedNum: readNumber(mission.achieved_num) ?? 0,
		isAchieved: mission.is_achieved === true || status === 2 || status === 3,
		isReceived: mission.is_received === true || status === 3,
	};
}

function collectClaimedChapterPointRewardIds(
	events: readonly OfficialApiDumpEvent[],
): number[] {
	return events
		.filter(
			isSuccessfulOfficialDataMigrationResponse(
				'/v1/chapter/get_point_rewards',
			),
		)
		.flatMap((event) => readRecordArray(event.response?.reward_list))
		.filter(
			(reward) =>
				reward.is_received === true || readNumber(reward.status) === 3,
		)
		.map((reward) => readNumber(reward.chapter_point_rewards_id))
		.filter((rewardId): rewardId is number => rewardId !== null);
}
