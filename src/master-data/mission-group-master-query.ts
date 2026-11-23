import type { Database } from 'bun:sqlite';
import { sqlInPlaceholders } from './sql-placeholders.ts';

export type MissionRow = {
	id: number;
	name: string;
	description: string;
	mission_type: number;
	mission_condition_num: number;
	transition_contents_id: number;
	sort_order: number;
};
export type MissionRewardRow = {
	missions_id: number;
	reward_category: number;
	reward_type: number;
	items_id: number;
	reward_num: number;
};
export type MissionAchieveRewardRow = {
	mission_type: number;
	achieve_mark_num: number;
	reward_type: number;
	items_id: number;
	reward_num: number;
	sort_order: number;
};
export type EventMissionSeriesRow = {
	id: number;
	start_time: string;
	end_time: string;
};
export type EventMissionRow = {
	id: number;
	event_mission_series_id: number;
	name: string;
	description: string;
	mission_condition_num: number;
	transition_contents_id: number;
	sort_order: number;
};
export type EventMissionRewardRow = {
	event_missions_id: number;
	reward_category: number;
	reward_type: number;
	items_id: number;
	reward_num: number;
};

export type MissionGroupRows = {
	missions: MissionRow[];
	rewards: MissionRewardRow[];
	achieveRewards: MissionAchieveRewardRow[];
	eventSeries: EventMissionSeriesRow[];
	eventMissions: EventMissionRow[];
	eventRewards: EventMissionRewardRow[];
};

export function queryMissionGroupRows(
	database: Database,
	now: string,
): MissionGroupRows {
	const missions = database
		.query<MissionRow, [string, string]>(
			[
				'SELECT id, name, description, mission_type, mission_condition_num, transition_contents_id, sort_order',
				'FROM master_missions',
				'WHERE datetime(start_time) <= datetime(?)',
				'AND datetime(end_time) > datetime(?)',
				'AND mission_type IN (1, 2, 3)',
				'AND open_type = 0',
				'ORDER BY mission_type, sort_order, id',
			].join(' '),
		)
		.all(now, now);
	const rewards = database
		.query<MissionRewardRow, []>(
			'SELECT missions_id, reward_category, reward_type, items_id, reward_num FROM master_mission_rewards ORDER BY missions_id, id',
		)
		.all();
	const achieveRewards = database
		.query<MissionAchieveRewardRow, []>(
			'SELECT mission_type, achieve_mark_num, reward_type, items_id, reward_num, sort_order FROM master_mission_achieve_rewards ORDER BY mission_type, sort_order, id',
		)
		.all();
	const eventSeries = database
		.query<EventMissionSeriesRow, [string, string]>(
			[
				'SELECT id, start_time, end_time',
				'FROM master_event_mission_series',
				'WHERE datetime(start_time) <= datetime(?)',
				'AND datetime(end_time) > datetime(?)',
				'ORDER BY id',
			].join(' '),
		)
		.all(now, now);
	if (eventSeries.length === 0)
		return {
			missions,
			rewards,
			achieveRewards,
			eventSeries,
			eventMissions: [],
			eventRewards: [],
		};
	const ids = eventSeries.map((row) => row.id);
	const eventMissions = database
		.query<EventMissionRow, number[]>(
			`SELECT id, event_mission_series_id, name, description, mission_condition_num, transition_contents_id, sort_order FROM master_event_missions WHERE event_mission_series_id IN (${sqlInPlaceholders(ids)}) AND open_type = 0 ORDER BY event_mission_series_id, sort_order, id`,
		)
		.all(...ids);
	const eventRewards = database
		.query<EventMissionRewardRow, number[]>(
			`SELECT event_missions_id, reward_category, reward_type, items_id, reward_num FROM master_event_mission_rewards WHERE event_mission_series_id IN (${sqlInPlaceholders(ids)}) ORDER BY event_missions_id, sort_order, id`,
		)
		.all(...ids);
	return {
		missions,
		rewards,
		achieveRewards,
		eventSeries,
		eventMissions,
		eventRewards,
	};
}
