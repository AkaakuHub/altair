import type { Database } from 'bun:sqlite';
import {
	type ActivityRecordMonthlyInfo,
	type ActivityRecordWatchReward,
	getActivityRecordMasterIdentityCatalogFromDatabase,
	getActivityRecordMonthlyInfoListFromDatabase,
} from '../../master-data/activity-record-master.ts';
import { projectActivityRecordState } from '../../state/activity-record-projection.ts';
import type { UserActivityRecordState } from '../../state/activity-record-types.ts';
import type {
	DailyQuestRecoveryResult,
	UserDailyQuestState,
} from '../../state/daily-quest-state.ts';
import { readDailyQuestRecoveryCount } from '../../state/daily-quest-state.ts';
import type { UserStepUpBeginnerMissionState } from '../../state/step-up-beginner-mission-state.ts';
import type { UserInventoryState } from '../../state/user-item-definition.ts';
import type {
	ActivityRecordPlayAdvDataResponse,
	ActivityRecordSetWatchableStatusResponse,
	ActivityRecordTopResponse,
	DailyQuestRecoveryChallengeCountResponse,
	DailyQuestRecoveryResultResponse,
	OutQuestLiveDailyStageSelectResponse,
	StepUpBeginnerMissionListResponse,
	UserDailyTicketInfo,
	WebviewThemeListResponse,
} from '../response-types/app-content-response-types.ts';

export function createActivityRecordTopResponse(
	database: Database,
	activityRecord: UserActivityRecordState,
	inventory: UserInventoryState,
): ActivityRecordTopResponse {
	return {
		activity_record_monthly_info_list: createActivityRecordMonthlyInfoList(
			database,
			activityRecord,
			inventory,
		),
	};
}

export function createActivityRecordPlayAdvDataResponse(
	watchRewardList: ActivityRecordWatchReward[],
): ActivityRecordPlayAdvDataResponse {
	return { watch_reward_list: structuredClone(watchRewardList) };
}

export function createActivityRecordSetWatchableStatusResponse(
	watchableStatus: number,
	advUnlockItemNum: number,
): ActivityRecordSetWatchableStatusResponse {
	return {
		watchable_status: watchableStatus,
		adv_unlock_item_num: advUnlockItemNum,
	};
}

export function createWebviewThemeListResponse(): WebviewThemeListResponse {
	return [];
}

export function createOutQuestLiveDailyStageSelectResponse(
	dailyQuest: UserDailyQuestState,
	nextResetTime: string,
): OutQuestLiveDailyStageSelectResponse {
	return {
		temporary_release_daily_quest_series_id_list:
			dailyQuest.temporaryReleaseDailyQuestSeriesIdList,
		user_daily_ticket_info: {
			max: dailyQuest.userDailyTicketInfo.max,
			next_reset_time: nextResetTime,
			num: dailyQuest.userDailyTicketInfo.num,
		},
	};
}

export function createDailyQuestTicketInfo(
	dailyQuest: UserDailyQuestState,
	nextResetTime: string,
): UserDailyTicketInfo {
	return {
		max: dailyQuest.userDailyTicketInfo.max,
		next_reset_time: nextResetTime,
		num: dailyQuest.userDailyTicketInfo.num,
	};
}

export function createDailyQuestRecoveryChallengeCountResponse(
	dailyQuest: UserDailyQuestState,
	gameDate: string,
): DailyQuestRecoveryChallengeCountResponse {
	return {
		challenge_count: dailyQuest.userDailyTicketInfo.num,
		recovery_count: readDailyQuestRecoveryCount(dailyQuest, gameDate),
		max_recovery_count: 3,
		price: 40,
	};
}

export function createDailyQuestRecoveryResultResponse(
	result: DailyQuestRecoveryResult,
): DailyQuestRecoveryResultResponse {
	return {
		challenge_count: result.challengeCount,
	};
}

export function createStepUpBeginnerMissionListResponse(
	mission: UserStepUpBeginnerMissionState,
): StepUpBeginnerMissionListResponse {
	return {
		step_up_mission_list: mission.stepUpMissionList.map((progress) => ({
			achieved_num: progress.achievedNum,
			is_achieved: progress.isAchieved,
			is_received: progress.isReceived,
			mission_id: progress.missionId,
		})),
	};
}

function createActivityRecordMonthlyInfoList(
	database: Database,
	activityRecord: UserActivityRecordState,
	inventory: UserInventoryState,
): ActivityRecordMonthlyInfo[] {
	const visibleActivityRecord = projectActivityRecordState(
		activityRecord,
		getActivityRecordMasterIdentityCatalogFromDatabase(database),
	);
	return getActivityRecordMonthlyInfoListFromDatabase(
		database,
		new Set(visibleActivityRecord.watchedActivityRecordAdvDataIds),
		new Set(visibleActivityRecord.displayedActivityRecordAdvSeriesIds),
		new Set(visibleActivityRecord.unlockedActivityRecordAdvDataIds),
		new Map(
			inventory.itemCategoryList
				.flatMap((category) => category.userItemList)
				.map((item) => [item.itemId, item.itemNum]),
		),
	);
}
