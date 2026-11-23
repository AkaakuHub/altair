import type {
	CommonMissionRewardMaster,
	MissionMaster,
} from '../state/mission-master.ts';
import type { MissionRewardState } from '../state/mission-types.ts';
import {
	createCommonMissionRewardIdentityFingerprint,
	createMissionIdentityFingerprint,
} from './mission-identity.ts';

type MissionMasterRow = {
	id: number;
	name: string;
	description: string;
	mission_condition_num: number;
	transition_contents_id: number;
};

export function createMissionMaster(
	row: MissionMasterRow,
	rewardList: MissionRewardState[],
	missionType: number,
): MissionMaster {
	return {
		missionId: row.id,
		name: row.name,
		description: row.description,
		conditionAchieveNum: row.mission_condition_num,
		rewardList,
		transitionContentsId: row.transition_contents_id,
		identityFingerprint: createMissionIdentityFingerprint({
			missionId: row.id,
			missionType,
			transitionContentsId: row.transition_contents_id,
		}),
	};
}

export function createMissionReward(row: {
	reward_category: number;
	reward_type: number;
	items_id: number;
	reward_num: number;
}): MissionRewardState {
	return {
		rewardType: row.reward_category,
		itemType: row.reward_type,
		itemId: row.items_id,
		rewardNum: row.reward_num,
	};
}

export function createCommonMissionRewardMaster(row: {
	id: number;
	clear_condition_num: number;
	reward_type: number;
	items_id: number;
	reward_num: number;
	order_id: number;
}): CommonMissionRewardMaster {
	return {
		commonMissionId: row.id,
		clearConditionNum: row.clear_condition_num,
		orderId: row.order_id,
		identityFingerprint: createCommonMissionRewardIdentityFingerprint({
			commonMissionId: row.id,
			orderId: row.order_id,
		}),
		reward: {
			itemType: row.reward_type,
			itemId: row.items_id,
			amount: row.reward_num,
		},
	};
}
