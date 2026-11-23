import type { MissionAchieveRewardMaster } from '../state/mission-master.ts';
import type { MissionRewardState } from '../state/mission-types.ts';
import { appendMapArrayValue } from './map-array.ts';
import type {
	EventMissionRewardRow,
	MissionAchieveRewardRow,
	MissionRewardRow,
} from './mission-group-master-query.ts';
import { createMissionReward } from './mission-master-row-mappers.ts';

export function mapMissionRewards(
	rows: readonly MissionRewardRow[],
): ReadonlyMap<number, MissionRewardState[]> {
	const result = new Map<number, MissionRewardState[]>();
	for (const row of rows)
		appendMapArrayValue(result, row.missions_id, createMissionReward(row));
	return result;
}
export function mapEventMissionRewards(
	rows: readonly EventMissionRewardRow[],
): ReadonlyMap<number, MissionRewardState[]> {
	const result = new Map<number, MissionRewardState[]>();
	for (const row of rows)
		appendMapArrayValue(
			result,
			row.event_missions_id,
			createMissionReward(row),
		);
	return result;
}
export function mapMissionAchieveRewards(
	rows: readonly MissionAchieveRewardRow[],
): ReadonlyMap<number, MissionAchieveRewardMaster[]> {
	const result = new Map<number, MissionAchieveRewardMaster[]>();
	for (const row of rows)
		appendMapArrayValue(result, row.mission_type, {
			targetNum: row.achieve_mark_num,
			rewardList: [
				{
					rewardType: 2,
					itemType: row.reward_type,
					itemId: row.items_id,
					rewardNum: row.reward_num,
				},
			],
		});
	return result;
}
