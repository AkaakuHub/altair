import type { Database } from 'bun:sqlite';
import {
	isRhythmGameClassMissionConditionType,
	type RhythmGameClassMissionConditionType,
} from '../state/rhythm-game-class-mission.ts';
import { sqlInPlaceholders } from './sql-placeholders.ts';

type RhythmGameClassData = {
	id: number;
	conditionType: RhythmGameClassMissionConditionType;
	goalCount: number;
	orderId: number;
};

export type RhythmGameClassMissionReward = {
	rewardType: number;
	rewardItemId: number;
	rewardNum: number;
};

export function getReceivableRhythmGameClassDataFromDatabase(
	database: Database,
	input: {
		conditionType: RhythmGameClassMissionConditionType;
		progress: number;
		receivedOrder: number;
	},
): RhythmGameClassData[] {
	const rows = database
		.query(
			[
				'SELECT id, rhythm_game_condition_type, goal_count, order_id',
				'FROM master_rhythm_game_class_datas',
				'WHERE rhythm_game_condition_type = ?',
				'AND goal_count <= ?',
				'AND order_id > ?',
				'ORDER BY order_id',
			].join(' '),
		)
		.all(input.conditionType, input.progress, input.receivedOrder) as Array<{
		id: number;
		rhythm_game_condition_type: number;
		goal_count: number;
		order_id: number;
	}>;
	return rows.flatMap((row) => {
		if (
			!isRhythmGameClassMissionConditionType(row.rhythm_game_condition_type)
		) {
			return [];
		}
		return [
			{
				id: row.id,
				conditionType: row.rhythm_game_condition_type,
				goalCount: row.goal_count,
				orderId: row.order_id,
			},
		];
	});
}

export function getRhythmGameClassMissionRewardsFromDatabase(
	database: Database,
	classDataIds: readonly number[],
): RhythmGameClassMissionReward[] {
	if (classDataIds.length === 0) {
		return [];
	}
	const rows = database
		.query(
			[
				'SELECT reward_type, reward_item_id, reward_num',
				'FROM master_rhythm_game_class_mission_rewards',
				`WHERE rhythm_game_class_datas_id IN (${sqlInPlaceholders(classDataIds)})`,
				'ORDER BY rhythm_game_class_datas_id, order_id',
			].join(' '),
		)
		.all(...classDataIds) as Array<{
		reward_type: number;
		reward_item_id: number;
		reward_num: number;
	}>;
	return rows.map((row) => ({
		rewardType: row.reward_type,
		rewardItemId: row.reward_item_id,
		rewardNum: row.reward_num,
	}));
}
