import type { ArchivePrizeMaster } from '../../state/archive-prize-definition.ts';
import { isRecord, type JsonObject } from '../../state/json-state-utils.ts';
import type {
	ArchiveListCharacterRequest,
	ArchiveListRequest,
} from './archive-list-request-parser.ts';

export function applyArchiveListRequest<T extends JsonObject>(
	archiveList: T[],
	request: ArchiveListRequest,
	findArchivePrizeMaster: (archiveId: string) => ArchivePrizeMaster | undefined,
): T[] {
	const sortedArchiveList = archiveList
		.filter((archive) =>
			archiveMatchesRequest(archive, request, findArchivePrizeMaster),
		)
		.sort((left, right) => compareArchiveListEntry(left, right, request));
	return sliceArchiveList(sortedArchiveList, request);
}

function archiveMatchesRequest(
	archive: JsonObject,
	request: ArchiveListRequest,
	findArchivePrizeMaster: (archiveId: string) => ArchivePrizeMaster | undefined,
): boolean {
	if (
		request.liveType !== undefined &&
		readNumberField(archive, 'live_type') !== request.liveType
	) {
		return false;
	}
	if (
		request.hasWithliveExtra === 1 &&
		readBooleanField(archive, 'has_extra') !== true
	) {
		return false;
	}
	if (
		request.hasWithliveExtra === 2 &&
		readBooleanField(archive, 'has_extra') !== false
	) {
		return false;
	}
	if (
		request.hasWithliveExtra === 1 &&
		request.hasWithliveExtraAdmission === 1 &&
		readBooleanField(archive, 'has_extra_admission') !== true
	) {
		return false;
	}
	if (
		request.hasWithliveExtra === 1 &&
		request.hasWithliveExtraAdmission === 2 &&
		readBooleanField(archive, 'has_extra_admission') !== false
	) {
		return false;
	}
	return archiveMatchesCharacters(
		archive,
		request.characters,
		findArchivePrizeMaster,
	);
}

function archiveMatchesCharacters(
	archive: JsonObject,
	characters: readonly ArchiveListCharacterRequest[],
	findArchivePrizeMaster: (archiveId: string) => ArchivePrizeMaster | undefined,
): boolean {
	const requestedAppearances = characters.filter(
		(character) => character.appearance === 1 || character.appearance === 2,
	);
	if (requestedAppearances.length === 0) {
		return true;
	}
	const characterIds = new Set(
		readArchiveCharacterIds(archive, findArchivePrizeMaster),
	);
	return requestedAppearances.every((character) => {
		const appears = characterIds.has(character.characterId);
		if (character.appearance === 1) {
			return appears;
		}
		return !appears;
	});
}

function readArchiveCharacterIds(
	archive: JsonObject,
	findArchivePrizeMaster: (archiveId: string) => ArchivePrizeMaster | undefined,
): number[] {
	const characterList = archive.character_list;
	const visibleCharacterIds = Array.isArray(characterList)
		? characterList
				.map((entry) =>
					isRecord(entry) ? readSafeInteger(entry.character_id) : undefined,
				)
				.filter(
					(characterId): characterId is number => characterId !== undefined,
				)
		: [];
	if (visibleCharacterIds.length > 0) {
		return visibleCharacterIds;
	}
	const archiveId = readArchiveId(archive);
	return findArchivePrizeMaster(archiveId)?.characterIds ?? [];
}

function compareArchiveListEntry(
	left: JsonObject,
	right: JsonObject,
	request: ArchiveListRequest,
): number {
	if (request.sort === 'star_count') {
		const starCountCompare = compareNumber(
			readNumberField(left, 'earned_star_count') ?? 0,
			readNumberField(right, 'earned_star_count') ?? 0,
			request.order,
		);
		if (starCountCompare !== 0) {
			return starCountCompare;
		}
		return compareIsoTimeDesc(left, right);
	}
	return compareNumber(
		readIsoTime(left, 'live_start_time'),
		readIsoTime(right, 'live_start_time'),
		request.order,
	);
}

function sliceArchiveList<T extends JsonObject>(
	archiveList: T[],
	request: ArchiveListRequest,
): T[] {
	if (request.limit === undefined) {
		return archiveList.slice(request.offset);
	}
	return archiveList.slice(request.offset, request.offset + request.limit);
}

function readArchiveId(archive: JsonObject): string {
	const archiveId = archive.archives_id;
	return typeof archiveId === 'string' ? archiveId : '';
}

function readSafeInteger(value: unknown): number | undefined {
	return typeof value === 'number' && Number.isSafeInteger(value)
		? value
		: undefined;
}

function readNumberField(
	archive: JsonObject,
	field: string,
): number | undefined {
	return readSafeInteger(archive[field]);
}

function readBooleanField(
	archive: JsonObject,
	field: string,
): boolean | undefined {
	const value = archive[field];
	return typeof value === 'boolean' ? value : undefined;
}

function readIsoTime(archive: JsonObject, field: string): number {
	const value = archive[field];
	if (typeof value !== 'string') {
		return 0;
	}
	const time = Date.parse(value);
	return Number.isFinite(time) ? time : 0;
}

function compareNumber(left: number, right: number, order: string | undefined) {
	const compare = left === right ? 0 : left < right ? -1 : 1;
	return order === 'asc' ? compare : -compare;
}

function compareIsoTimeDesc(left: JsonObject, right: JsonObject): number {
	return compareNumber(
		readIsoTime(left, 'live_start_time'),
		readIsoTime(right, 'live_start_time'),
		'desc',
	);
}
