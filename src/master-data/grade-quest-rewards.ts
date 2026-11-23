import type { Database } from 'bun:sqlite';
import { sqlInPlaceholders } from './sql-placeholders.ts';

type GradeQuestRewardData = {
	itemId: number;
	itemType: number;
	amount: number;
};

export function getGradeQuestRewardData(
	database: Database,
	rewardIds: readonly number[],
): GradeQuestRewardData[] {
	if (rewardIds.length === 0) {
		return [];
	}
	const rows = database
		.query(
			[
				'SELECT reward_type, reward_item_id, reward_num',
				'FROM master_grade_quest_rewards_datas',
				`WHERE grade_quest_rewards_id IN (${sqlInPlaceholders(rewardIds)})`,
				'ORDER BY grade_quest_rewards_id, id',
			].join(' '),
		)
		.all(...rewardIds) as Array<{
		reward_type: number;
		reward_item_id: number;
		reward_num: number;
	}>;
	return rows.map((row) => ({
		itemId: row.reward_item_id,
		itemType: row.reward_type,
		amount: row.reward_num,
	}));
}
