import type { BeginnerMissionCategoryMaster } from '../../state/beginner-mission-master.ts';
import { findBeginnerMissionProgress } from '../../state/beginner-mission-progress-state.ts';
import { isBeginnerMissionTypeReceived } from '../../state/beginner-mission-reward-state.ts';
import type { UserBeginnerMissionState } from '../../state/beginner-mission-types.ts';
import type { MissionGroupMaster } from '../../state/mission-master.ts';
import { getMissionProgress } from '../../state/mission-progress-aggregate.ts';
import type {
	MissionRewardState,
	UserMissionState,
} from '../../state/mission-types.ts';
import type {
	BeginnerMissionListResponse,
	MissionListResponse,
	MissionRewardResponse,
} from '../response-types/mission-response-types.ts';

export function createBeginnerMissionListResponse(
	mission: UserBeginnerMissionState,
	missionCategories: readonly BeginnerMissionCategoryMaster[],
): BeginnerMissionListResponse {
	return {
		mission_category_list: missionCategories.map((category) => {
			const missionList = category.missionList.map((masterMission) => {
				const progress = findBeginnerMissionProgress(
					mission,
					masterMission.missionId,
					masterMission.identityFingerprint,
				);
				return {
					achieved_num: progress?.achievedNum ?? 0,
					mission_id: masterMission.missionId,
					status: progress?.status ?? 0,
				};
			});
			return {
				is_received: isBeginnerMissionTypeReceived(mission, category),
				mission_list: missionList,
				mission_type: category.missionType,
			};
		}),
	};
}

export function createMissionListResponse(
	mission: UserMissionState,
	missionGroups: readonly MissionGroupMaster[],
	receivedOrder: number = mission.commonMissionInfo.receivedOrder,
): MissionListResponse {
	return {
		common_mission_info: {
			received_order: receivedOrder,
			rhythm_game_star: mission.commonMissionInfo.rhythmGameStar,
			school_stage_star: mission.commonMissionInfo.schoolStageStar,
		},
		mission_list: missionGroups.map((group) => {
			const achievedMissionCount = group.missionList.filter(
				(entry) =>
					getMissionProgress(
						mission,
						entry.missionId,
						entry.identityFingerprint,
					)?.isAchieved === true,
			).length;
			return {
				achieve_reward_list: group.achieveRewardList.map((reward) => ({
					achieved_num: Math.min(reward.targetNum, achievedMissionCount),
					is_achieved: achievedMissionCount >= reward.targetNum,
					reward_list: reward.rewardList.map(createRewardResponse),
					target_num: reward.targetNum,
				})),
				end_date: group.endDate,
				mission_type: group.missionType,
				mission_list: group.missionList.map((entry) => {
					const progress = getMissionProgress(
						mission,
						entry.missionId,
						entry.identityFingerprint,
					);
					return {
						achieved_num: progress?.achievedNum ?? 0,
						condition_achieve_num: entry.conditionAchieveNum,
						description: entry.description,
						is_achieved: progress?.isAchieved ?? false,
						mission_id: entry.missionId,
						name: entry.name,
						reward_list: entry.rewardList.map(createRewardResponse),
						transition_contents_id: entry.transitionContentsId,
					};
				}),
				start_date: group.startDate,
			};
		}),
	};
}

function createRewardResponse(
	reward: MissionRewardState,
): MissionRewardResponse {
	return {
		item_id: reward.itemId,
		item_type: reward.itemType,
		reward_num: reward.rewardNum,
		reward_type: reward.rewardType,
	};
}
