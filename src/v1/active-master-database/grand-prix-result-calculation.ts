import type { JsonValue } from '../../state/json-state-utils.ts';
import { isJsonRecord } from '../route-support/request-fields.ts';
import {
	calculateGrandPrixScorePoint,
	type GrandPrixCardBonusTarget,
} from './grand-prix-point-bonus.ts';
import { numberValue, parseJson } from './json-utils.ts';
import type { JsonRecord } from './types.ts';

export function playReportCardBonusTargets(
	playReport: string,
): GrandPrixCardBonusTarget[] {
	if (playReport.length === 0) return [];
	const parsed = parseJsonSafely(playReport);
	if (!isJsonRecord(parsed) || !Array.isArray(parsed.character_info)) return [];
	return parsed.character_info.flatMap((entry) => {
		if (!isJsonRecord(entry)) return [];
		return [
			cardBonusTarget(entry, 'main_card_id', 'main_count'),
			cardBonusTarget(entry, 'side1_card_id', 'side1_count'),
			cardBonusTarget(entry, 'side2_card_id', 'side2_count'),
		].filter(
			(target): target is GrandPrixCardBonusTarget => target !== undefined,
		);
	});
}

export function calculateGrandPrixDailyScore(
	score: number,
	pointBonusList: JsonRecord[],
): number {
	return calculateGrandPrixScorePoint(score, pointBonusList);
}

function cardBonusTarget(
	entry: JsonRecord,
	cardIdKey: string,
	countKey: string,
): GrandPrixCardBonusTarget | undefined {
	const cardId = numberValue(entry[cardIdKey]);
	return cardId === 0
		? undefined
		: { cardId, limitBreakCount: numberValue(entry[countKey]) };
}

function parseJsonSafely(value: string): JsonValue | undefined {
	try {
		return parseJson(value);
	} catch {
		return undefined;
	}
}
