import type { Database } from 'bun:sqlite';
import type { CommonMissionRewardMaster } from '../state/mission-master.ts';
import { currentUtcIsoDateTime } from './master-time.ts';
import { createCommonMissionRewardMaster } from './mission-master-row-mappers.ts';

type CommonMissionRow = {
	id: number;
	clear_condition_num: number;
	reward_type: number;
	items_id: number;
	reward_num: number;
	order_id: number;
};

export function getReceivableCommonMissionRewardsFromDatabase(
	database: Database,
	starTotal: number,
	receivedOrder: number,
): CommonMissionRewardMaster[] {
	const now = currentUtcIsoDateTime();
	return database
		.query<CommonMissionRow, [string, string, number, number]>(
			[
				'SELECT id, clear_condition_num, reward_type, items_id, reward_num, order_id',
				'FROM master_common_missions',
				'WHERE datetime(start_time) <= datetime(?)',
				'AND datetime(end_time) > datetime(?)',
				'AND clear_condition_num <= ?',
				'AND order_id > ?',
				'ORDER BY order_id, id',
			].join(' '),
		)
		.all(now, now, starTotal, receivedOrder)
		.map(createCommonMissionRewardMaster);
}
