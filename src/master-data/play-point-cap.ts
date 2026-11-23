import type { Database } from 'bun:sqlite';
import { PLAY_POINT_CAP_UP_ITEM_ID } from '../state/play-point-cap-state.ts';

export function getGradePlayPointCapBonusFromDatabase(
	database: Database,
	gradePoint: number,
): number {
	const row = database
		.query(
			[
				'SELECT COALESCE(SUM(reward.reward_num * item.effect_value), 0) AS bonus',
				'FROM master_grade_datas AS grade_data',
				'JOIN master_grade_rewards AS grade_reward',
				'ON grade_reward.grade_num = grade_data.grade_num',
				'JOIN master_grade_reward_datas AS reward',
				'ON reward.grade_rewards_id = grade_reward.id',
				'JOIN master_items AS item',
				'ON item.id = reward.reward_item_id',
				'WHERE grade_data.require_grade_points <= ?',
				'AND reward.reward_item_id = ?',
			].join(' '),
		)
		.get(gradePoint, PLAY_POINT_CAP_UP_ITEM_ID) as { bonus: number } | null;
	return row?.bonus ?? 0;
}
