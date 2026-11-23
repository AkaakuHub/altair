import type { Database } from 'bun:sqlite';
import { calculateGrandPrixPoint } from '../../domain/grand-prix-point-calculation.ts';
import { numberValue } from './json-utils.ts';
import type { JsonRecord } from './types.ts';

export type GrandPrixCardBonusTarget = {
	cardId: number;
	limitBreakCount: number;
};

export function createGrandPrixPointBonusListFromDatabase(
	database: Database,
	grandPrixId: number,
	targets: GrandPrixCardBonusTarget[],
) {
	return targets
		.map((target) => grandPrixCardPointBonus(database, grandPrixId, target))
		.filter((bonus) => bonus !== undefined);
}

export function calculateGrandPrixScorePoint(
	score: number,
	pointBonusList: JsonRecord[],
): number {
	return calculateGrandPrixPoint(
		score,
		pointBonusList.map((bonus) => ({
			targetType: pointBonusTargetType(bonus),
			bonusValue: numberValue(bonus.bonus_value),
		})),
	).dailyPoint;
}

function pointBonusTargetType(bonus: JsonRecord): 1 | 3 | 4 | 5 {
	const targetType = numberValue(bonus.target_type);
	if (
		targetType === 1 ||
		targetType === 3 ||
		targetType === 4 ||
		targetType === 5
	) {
		return targetType;
	}
	throw new Error(
		`Unsupported Grand Prix point bonus type: ${String(targetType)}`,
	);
}

function grandPrixCardPointBonus(
	database: Database,
	grandPrixId: number,
	target: GrandPrixCardBonusTarget,
) {
	const card = database
		.query('SELECT style FROM master_card_datas WHERE id = ?')
		.get(target.cardId) as { style: number } | null;
	if (card === null || card.style === 0) {
		return undefined;
	}
	const row = database
		.query(
			[
				'SELECT target_type, target_detail, target_num, bonus_value',
				'FROM master_grand_prix_point_bonuses',
				'WHERE grand_prixes_id = ? AND target_type = 1 AND target_detail = ? AND target_num <= ?',
				'ORDER BY target_num DESC',
				'LIMIT 1',
			].join(' '),
		)
		.get(grandPrixId, card.style, target.limitBreakCount) as {
		target_type: number;
		target_detail: number;
		target_num: number;
		bonus_value: number;
	} | null;
	if (row === null) {
		return undefined;
	}
	return {
		target_type: row.target_type,
		target_detail: row.target_detail,
		target_num: row.target_num,
		bonus_value: row.bonus_value,
	};
}
