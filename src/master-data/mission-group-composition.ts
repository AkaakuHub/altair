import type {
	MissionGroupMaster,
	MissionMaster,
} from '../state/mission-master.ts';
import { appendMapArrayValue } from './map-array.ts';
import { normalizeUtcDateTime } from './master-date-time.ts';
import type { MissionGroupRows } from './mission-group-master-query.ts';
import {
	mapEventMissionRewards,
	mapMissionAchieveRewards,
	mapMissionRewards,
} from './mission-group-reward-mapper.ts';
import { createMissionMaster } from './mission-master-row-mappers.ts';

export function composeMissionGroups(
	rows: MissionGroupRows,
): MissionGroupMaster[] {
	const rewards = mapMissionRewards(rows.rewards);
	const achieve = mapMissionAchieveRewards(rows.achieveRewards);
	const byType = new Map<number, MissionMaster[]>();
	for (const row of rows.missions)
		appendMapArrayValue(
			byType,
			row.mission_type,
			createMissionMaster(row, rewards.get(row.id) ?? [], row.mission_type),
		);
	const standard = [1, 2, 3]
		.map((missionType) => ({
			missionType,
			startDate: null,
			endDate: null,
			achieveRewardList: achieve.get(missionType) ?? [],
			missionList: byType.get(missionType) ?? [],
		}))
		.filter((group) => group.missionList.length > 0);
	const eventRewards = mapEventMissionRewards(rows.eventRewards);
	const bySeries = new Map<number, MissionMaster[]>();
	for (const row of rows.eventMissions)
		appendMapArrayValue(
			bySeries,
			row.event_mission_series_id,
			createMissionMaster(row, eventRewards.get(row.id) ?? [], 4),
		);
	const events = rows.eventSeries
		.map((series) => ({
			missionType: 4,
			startDate: normalizeUtcDateTime(series.start_time),
			endDate: normalizeUtcDateTime(series.end_time),
			achieveRewardList: [],
			missionList: bySeries.get(series.id) ?? [],
		}))
		.filter((group) => group.missionList.length > 0);
	return [...standard, ...events];
}
