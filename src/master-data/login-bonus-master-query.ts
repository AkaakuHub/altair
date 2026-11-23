import type { Database } from 'bun:sqlite';
import type {
	LoginBonusRewardRow,
	LoginBonusRow,
} from './login-bonus-master-types.ts';
import { appendMapArrayValue } from './map-array.ts';

export function readLoginBonusRewards(
	database: Database,
	rewardSeriesIds: readonly number[],
): ReadonlyMap<number, LoginBonusRewardRow[]> {
	if (rewardSeriesIds.length === 0) {
		return new Map();
	}
	const rows = database
		.query<LoginBonusRewardRow, number[]>(
			[
				'SELECT r.login_bonus_reward_series_id,',
				'r.day_count,',
				'r.reward_type,',
				'r.reward_id,',
				'r.reward_num,',
				't.description AS reward_name',
				'FROM master_login_bonus_reward_datas r',
				'JOIN master_present_texts t ON t.id = r.reward_text_id',
				`WHERE r.login_bonus_reward_series_id IN (${rewardSeriesIds.map(() => '?').join(', ')})`,
				'ORDER BY r.login_bonus_reward_series_id, r.day_count',
			].join(' '),
		)
		.all(...rewardSeriesIds);
	const rewardsBySeriesId = new Map<number, LoginBonusRewardRow[]>();
	for (const row of rows) {
		appendMapArrayValue(
			rewardsBySeriesId,
			row.login_bonus_reward_series_id,
			row,
		);
	}
	return rewardsBySeriesId;
}

export function readLoginBonusRows(database: Database): LoginBonusRow[] {
	return database
		.query<LoginBonusRow, []>(
			[
				"SELECT id, name, login_bonus_reward_series_id, start_time, end_time, __row_index AS row_index, 'normal' AS login_bonus_kind",
				'FROM master_login_bonuses',
				'UNION ALL',
				"SELECT id, name, login_bonus_reward_series_id, start_time, end_time, __row_index AS row_index, 'event' AS login_bonus_kind",
				'FROM master_event_login_bonuses',
				'ORDER BY id',
			].join(' '),
		)
		.all();
}
