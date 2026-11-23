import type { Database } from 'bun:sqlite';

export type ActivityRecordSeriesRow = {
	id: number;
	name: string;
	description: string;
	start_time: string;
	end_time: string;
	is_badge_display_type: number;
};

export type ActivityRecordAdvRow = {
	id: number;
	adv_series_id: number;
	name: string;
	description: string;
	open_season_fan_level: number;
	reward_type: string | null;
	watch_reward_id: string | null;
	watch_reward_num: string | null;
	order_id: number;
	sub_title_name: string;
	adv_unlock_item_id: number;
	adv_unlock_item_num: number;
	adv_unlock_condition_value: number;
};

export function getLatestActivityRecordSeriesRow(
	database: Database,
	now: string,
): ActivityRecordSeriesRow | undefined {
	return (
		database
			.query<ActivityRecordSeriesRow, [string, string]>(
				[
					'SELECT id, name, description, start_time, end_time,',
					'is_badge_display_type',
					'FROM master_adv_series',
					'WHERE datetime(start_time) <= datetime(?)',
					'AND datetime(end_time) > datetime(?)',
					'ORDER BY datetime(start_time) DESC, id DESC',
					'LIMIT 1',
				].join(' '),
			)
			.get(now, now) ?? undefined
	);
}

export function getActivityRecordSeriesRows(
	database: Database,
	now: string,
): ActivityRecordSeriesRow[] {
	return database
		.query<ActivityRecordSeriesRow, [string, string]>(
			[
				'SELECT id, name, description, start_time, end_time,',
				'is_badge_display_type',
				'FROM master_adv_series',
				'WHERE datetime(start_time) <= datetime(?)',
				'AND datetime(end_time) > datetime(?)',
				'ORDER BY id',
			].join(' '),
		)
		.all(now, now);
}

export function getActivityRecordAdvRows(
	database: Database,
	now: string,
): ActivityRecordAdvRow[] {
	return database
		.query<ActivityRecordAdvRow, [string, string]>(
			[
				'SELECT id, adv_series_id, name, description,',
				'open_season_fan_level, reward_type, watch_reward_id,',
				'watch_reward_num, order_id, sub_title_name,',
				'adv_unlock_item_id, adv_unlock_item_num, adv_unlock_condition_value',
				'FROM master_adv_datas',
				'WHERE datetime(start_time) <= datetime(?)',
				'AND datetime(end_time) > datetime(?)',
				'ORDER BY adv_series_id, order_id, id',
			].join(' '),
		)
		.all(now, now);
}
