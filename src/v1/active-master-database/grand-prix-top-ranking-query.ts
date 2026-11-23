import type { Database } from 'bun:sqlite';
import { getGrandPrixRewardDataRows } from '../../master-data/grand-prix-master-queries.ts';

export function hasGrandPrixMaster(
	database: Database,
	grandPrixId: number,
): boolean {
	return (
		database
			.query('SELECT id FROM master_grand_prix WHERE id = ?')
			.get(grandPrixId) !== null
	);
}

export function getGrandPrixRewardList(
	database: Database,
	grandPrixId: number,
	grandPrixType: number,
) {
	const rows = database
		.query(
			[
				'SELECT id, min_target_num, max_target_num',
				'FROM master_grand_prix_rewards',
				'WHERE grand_prixes_id = ? AND grand_prix_reward_type = ? AND is_display = 1',
				'ORDER BY id',
			].join(' '),
		)
		.all(grandPrixId, grandPrixType) as Array<{
		id: number;
		min_target_num: number;
		max_target_num: number;
	}>;
	return rows.map((row) => ({
		grand_prix_rewards_id: row.id,
		min_target_num: row.min_target_num,
		max_target_num: row.max_target_num,
		reward_datas: getGrandPrixRewardDataList(database, row.id),
	}));
}

function getGrandPrixRewardDataList(
	database: Database,
	grandPrixRewardsId: number,
) {
	const rows = getGrandPrixRewardDataRows(database, grandPrixRewardsId);
	return rows.map((row) => ({
		grand_prix_reward_datas_id: row.id,
		item_type: row.reward_type,
		item_id: row.reward_item_id,
		num: row.reward_num,
	}));
}
