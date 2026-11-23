import type {
	BeginnerMissionCategoryMaster,
	BeginnerMissionMaster,
} from '../state/beginner-mission-master.ts';
import { appendMapArrayValue } from './map-array.ts';
import {
	createBeginnerMissionCategoryIdentityFingerprint,
	createBeginnerMissionIdentityFingerprint,
} from './mission-identity.ts';

type BeginnerMissionRewardMaster = {
	itemType: number;
	itemId: number;
	amount: number;
};

type BeginnerMissionRow = {
	id: number;
	name: string;
	description: string;
	mission_type: number;
	mission_condition_type: number;
	mission_condition_num: number;
	mission_condition_detail: number;
	transition_contents_id: number;
	sort_order: number;
};

type BeginnerMissionRewardRow = {
	missions_id: number;
	reward_type: number;
	items_id: number;
	reward_num: number;
};

type BeginnerMissionBannerRewardRow = {
	mission_type: number;
	item_type: number;
	item_id: number;
	num: number;
};

export function getBeginnerMissionCategoriesFromDatabase(
	database: Database,
): BeginnerMissionCategoryMaster[] {
	const rows = database
		.query<BeginnerMissionRow, []>(
			[
				'SELECT id, name, description, mission_type, mission_condition_type, mission_condition_num, mission_condition_detail, transition_contents_id, sort_order',
				'FROM master_missions',
				'WHERE mission_type IN (91, 92, 93)',
				'ORDER BY mission_type, sort_order, id',
			].join(' '),
		)
		.all();
	const missionByType = new Map<number, BeginnerMissionMaster[]>();
	for (const row of rows) {
		appendMapArrayValue(missionByType, row.mission_type, {
			missionId: row.id,
			name: row.name,
			description: row.description,
			conditionType: row.mission_condition_type,
			conditionAchieveNum: row.mission_condition_num,
			conditionDetail: row.mission_condition_detail,
			transitionContentsId: row.transition_contents_id,
			sortOrder: row.sort_order,
			identityFingerprint: createBeginnerMissionIdentityFingerprint({
				missionId: row.id,
				missionType: row.mission_type,
				conditionType: row.mission_condition_type,
				conditionDetail: row.mission_condition_detail,
				transitionContentsId: row.transition_contents_id,
			}),
		});
	}
	return [91, 92, 93]
		.map((missionType) => {
			const missionList = missionByType.get(missionType) ?? [];
			return {
				missionType,
				missionList,
				identityFingerprint: createBeginnerMissionCategoryIdentityFingerprint(
					missionType,
					missionList.flatMap((mission) =>
						mission.identityFingerprint === undefined
							? []
							: [mission.identityFingerprint],
					),
				),
			};
		})
		.filter((category) => category.missionList.length > 0);
}

export function getBeginnerMissionRewardsFromDatabase(
	database: Database,
): ReadonlyMap<number, readonly BeginnerMissionRewardMaster[]> {
	const rows = database
		.query<BeginnerMissionRewardRow, []>(
			[
				'SELECT reward.missions_id, reward.reward_type, reward.items_id, reward.reward_num',
				'FROM master_mission_rewards reward',
				'JOIN master_missions mission ON mission.id = reward.missions_id',
				'WHERE mission.mission_type IN (91, 92, 93)',
				'ORDER BY reward.missions_id, reward.id',
			].join(' '),
		)
		.all();
	const rewardsByMissionId = new Map<number, BeginnerMissionRewardMaster[]>();
	for (const row of rows) {
		appendMapArrayValue(rewardsByMissionId, row.missions_id, {
			itemType: row.reward_type,
			itemId: row.items_id,
			amount: row.reward_num,
		});
	}
	return rewardsByMissionId;
}

export function getBeginnerMissionBannerRewardsFromDatabase(
	database: Database,
): ReadonlyMap<number, BeginnerMissionRewardMaster> {
	const rows = database
		.query<BeginnerMissionBannerRewardRow, []>(
			[
				'SELECT mission_type, item_type, item_id, num',
				'FROM master_beginner_mission_banner_rewards',
				'WHERE mission_type IN (91, 92, 93)',
				'ORDER BY mission_type',
			].join(' '),
		)
		.all();
	return new Map(
		rows.map((row) => [
			row.mission_type,
			{
				itemType: row.item_type,
				itemId: row.item_id,
				amount: row.num,
			},
		]),
	);
}

import type { Database } from 'bun:sqlite';
