import { type JsonObject, readNumber } from './json-state-utils.ts';

export function applyUserCardLimitBreakAvailability(card: JsonObject): void {
	const limitBreakTimes = readNumber(
		card.limit_break_times,
		'user card limit_break_times',
	);
	const maxLimitBreakTimes = readNumber(
		card.max_limit_break_times,
		'user card max_limit_break_times',
	);
	if (limitBreakTimes >= maxLimitBreakTimes) {
		card.is_limit_break = false;
	}
}
