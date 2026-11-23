import { isRecord } from '../../state/json-state-utils.ts';

export type ArchiveListRequest = {
	liveType?: number;
	hasWithliveExtra?: number;
	hasWithliveExtraAdmission?: number;
	characters: ArchiveListCharacterRequest[];
	sort?: string;
	order?: string;
	offset: number;
	limit?: number;
};

export type ArchiveListCharacterRequest = {
	characterId: number;
	appearance?: number;
};

export function parseArchiveListRequest(request: unknown): ArchiveListRequest {
	if (!isRecord(request)) return { characters: [], offset: 0 };
	const parsed: ArchiveListRequest = {
		characters: parseCharacterRequests(request.characters),
		offset: readNonNegativeInteger(request.offset) ?? 0,
	};
	const liveType = readSafeInteger(request.live_type);
	if (liveType !== undefined) parsed.liveType = liveType;
	const hasExtra = readSafeInteger(request.has_withlive_extra);
	if (hasExtra !== undefined) parsed.hasWithliveExtra = hasExtra;
	const hasAdmission = readSafeInteger(request.has_withlive_extra_admission);
	if (hasAdmission !== undefined)
		parsed.hasWithliveExtraAdmission = hasAdmission;
	if (typeof request.sort === 'string') parsed.sort = request.sort;
	if (typeof request.order === 'string') parsed.order = request.order;
	const limit = readPositiveInteger(request.limit);
	if (limit !== undefined) parsed.limit = limit;
	return parsed;
}

function parseCharacterRequests(value: unknown): ArchiveListCharacterRequest[] {
	if (!Array.isArray(value)) return [];
	return value.flatMap((entry) => {
		if (!isRecord(entry)) return [];
		const characterId = readSafeInteger(entry.character_id);
		if (characterId === undefined) return [];
		const appearance = readSafeInteger(entry.appearance);
		return [
			{ characterId, ...(appearance === undefined ? {} : { appearance }) },
		];
	});
}

function readSafeInteger(value: unknown): number | undefined {
	return typeof value === 'number' && Number.isSafeInteger(value)
		? value
		: undefined;
}

function readNonNegativeInteger(value: unknown): number | undefined {
	const integer = readSafeInteger(value);
	return integer !== undefined && integer >= 0 ? integer : undefined;
}

function readPositiveInteger(value: unknown): number | undefined {
	const integer = readSafeInteger(value);
	return integer !== undefined && integer > 0 ? integer : undefined;
}
