import type { Database } from 'bun:sqlite';
import { stamina } from './basic-data.ts';
import type { QuestTopGradeDetail, QuestTopStatus } from './quest-top-types.ts';

type TimedMasterTableName =
	| 'master_daily_quest_series'
	| 'master_dream_quest_series'
	| 'master_music_learning_quest_series'
	| 'master_raid_events'
	| 'master_standard_quest_areas';

export type TimedMasterRow = {
	id: number;
	start_time: string;
	end_time: string;
};

function getActiveTimedMasterRow(
	database: Database,
	tableName: TimedMasterTableName,
	now: string,
): TimedMasterRow | null {
	return database
		.query(
			[
				`SELECT id, start_time, end_time FROM ${tableName}`,
				'WHERE datetime(start_time) <= datetime(?)',
				'AND datetime(end_time) > datetime(?)',
				'ORDER BY id DESC',
				'LIMIT 1',
			].join(' '),
		)
		.get(now, now) as TimedMasterRow | null;
}

export function getStandardLiveStatus(
	database: Database,
	now: string,
): QuestTopStatus {
	return getActiveTimedMasterRow(
		database,
		'master_standard_quest_areas',
		now,
	) === null
		? 0
		: 1;
}

export function getDailyLiveStatus(
	database: Database,
	now: string,
): QuestTopStatus {
	return getActiveTimedMasterRow(database, 'master_daily_quest_series', now) ===
		null
		? 0
		: 1;
}

export function getMusicLiveStatus(
	database: Database,
	now: string,
): QuestTopStatus {
	return getActiveTimedMasterRow(
		database,
		'master_music_learning_quest_series',
		now,
	) === null
		? 0
		: 1;
}

export function getDreamLiveStatus(
	database: Database,
	now: string,
): QuestTopStatus {
	return getActiveTimedMasterRow(database, 'master_dream_quest_series', now) ===
		null
		? 0
		: 1;
}

export function getActiveRaidEvent(
	database: Database,
	now: string,
): TimedMasterRow | null {
	return getActiveTimedMasterRow(database, 'master_raid_events', now);
}

export function getQuestTopGradeDetail(
	database: Database,
): QuestTopGradeDetail {
	const rewards = database
		.query('SELECT id FROM master_grade_rewards ORDER BY id')
		.all() as Array<{ id: number }>;
	return {
		grade_num: 1,
		is_not_received_grade_reward: false,
		season_grade_id: 0,
		season_grade_point: 0,
		season_grade_point_rank: 0,
		status: 1,
		total_grade_point: 0,
		grade_rewards: rewards.map((reward) => ({
			grade_rewards_id: reward.id,
			reward_status: 1,
		})),
	};
}

export function getActiveCampaignIds(
	database: Database,
	now: string,
): number[] {
	const rows = database
		.query(
			[
				'SELECT id',
				'FROM master_campaign',
				'WHERE datetime(start_time) <= datetime(?)',
				'AND datetime(end_time) > datetime(?)',
				'ORDER BY id',
			].join(' '),
		)
		.all(now, now) as Array<{ id: number }>;
	return rows.map((row) => row.id);
}

export function getStandardAreaSelect(database: Database, now: string) {
	const areas = database
		.query<{ id: number }, [string, string]>(
			[
				'SELECT id',
				'FROM master_standard_quest_areas',
				'WHERE datetime(start_time) <= datetime(?)',
				'AND datetime(end_time) > datetime(?)',
				'ORDER BY id',
			].join(' '),
		)
		.all(now, now);
	return {
		name: 'エリアセレクト',
		area_list: areas.map((area) => ({ area_id: area.id, is_lock: false })),
		user_stamina: stamina(),
	};
}
