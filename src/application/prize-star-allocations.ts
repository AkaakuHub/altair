import { isRecord } from '../state/json-state-utils.ts';

export type PrizeStarAllocation = Readonly<{
	characterId: number;
	starNum: number;
}>;

export function areValidPrizeStarAllocations(
	allocations: readonly PrizeStarAllocation[],
): boolean {
	const characters = new Set<number>();
	let total = 0;
	for (const allocation of allocations) {
		if (
			!Number.isSafeInteger(allocation.characterId) ||
			allocation.characterId <= 0 ||
			!Number.isSafeInteger(allocation.starNum) ||
			allocation.starNum <= 0 ||
			characters.has(allocation.characterId)
		)
			return false;
		characters.add(allocation.characterId);
		total += allocation.starNum;
		if (!Number.isSafeInteger(total)) return false;
	}
	return true;
}

export function readPrizeStarAllocations(
	setStarJson: string,
): PrizeStarAllocation[] | undefined {
	let parsed: unknown;
	try {
		parsed = JSON.parse(setStarJson);
	} catch {
		return undefined;
	}
	if (!isRecord(parsed) || !Array.isArray(parsed.set_star_info_list))
		return undefined;
	const allocations: PrizeStarAllocation[] = [];
	for (const entry of parsed.set_star_info_list) {
		if (
			!isRecord(entry) ||
			typeof entry.character_id !== 'number' ||
			typeof entry.set_star_num !== 'number'
		)
			return undefined;
		allocations.push({
			characterId: entry.character_id,
			starNum: entry.set_star_num,
		});
	}
	return areValidPrizeStarAllocations(allocations) ? allocations : undefined;
}
