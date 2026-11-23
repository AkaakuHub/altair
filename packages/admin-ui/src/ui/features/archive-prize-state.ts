import type { AdminStateResponse } from '@altair/runtime/admin/dto/admin-state-response-schema.ts';
import { hasAdminDraftChanges } from '../../domain/forms/draft.ts';
import { parseSafeFormInteger } from '../../domain/forms/number.ts';
import type { AdminMessages } from '../../i18n/messages.ts';

export type ArchiveGiftPoint =
	AdminStateResponse['state']['archiveGiftPoints'][number];
type ArchiveGiftPointValues = Pick<
	ArchiveGiftPoint,
	| 'playerId'
	| 'liveId'
	| 'totalUserGiftPoint'
	| 'totalUserGiftPointWithoutArchive'
>;

export type ArchiveListItem = NonNullable<
	AdminStateResponse['state']['userArchiveCollections'][number]['archiveList']
>[number];
export type ArchivePrizePresent =
	AdminStateResponse['state']['userPresentBoxes'][number]['presentList'][number];
type MemberFanLevel =
	AdminStateResponse['state']['userStatuses'][number]['memberFanLevels'][number];

export type ArchiveGiftPointForm = {
	liveId: string;
	totalUserGiftPoint: string;
	totalUserGiftPointWithoutArchive: string;
};

export type ArchivePrizeStarForm = {
	presentBoxId: string;
	starNumsByCharacterId: Record<number, string>;
};

export type ArchivePrizeCandidate = {
	characterId: number;
	memberFanLevel: number;
	memberFanExperience: number;
};

export const emptyArchiveGiftPointForm: ArchiveGiftPointForm = {
	liveId: '',
	totalUserGiftPoint: '0',
	totalUserGiftPointWithoutArchive: '0',
};

export const emptyArchivePrizeStarForm: ArchivePrizeStarForm = {
	presentBoxId: '',
	starNumsByCharacterId: {},
};

function createFormFromGiftPoint(
	point: Omit<ArchiveGiftPointValues, 'playerId'>,
): ArchiveGiftPointForm {
	return {
		liveId: point.liveId,
		totalUserGiftPoint: String(point.totalUserGiftPoint),
		totalUserGiftPointWithoutArchive: String(
			point.totalUserGiftPointWithoutArchive,
		),
	};
}

export function createArchiveGiftPointSelectionForm(
	points: readonly ArchiveGiftPointValues[],
	playerId: string,
	liveId: string,
): ArchiveGiftPointForm {
	const point = points.find(
		(entry) => entry.playerId === playerId && entry.liveId === liveId,
	);
	return point
		? createFormFromGiftPoint(point)
		: { ...emptyArchiveGiftPointForm, liveId };
}

export function findArchiveGiftPointForArchive(
	archive: ArchiveListItem,
	points: readonly ArchiveGiftPoint[],
	playerId: string,
): ArchiveGiftPoint | undefined {
	const liveId = readArchiveId(archive);
	return points.find(
		(entry) => entry.playerId === playerId && entry.liveId === liveId,
	);
}

export function filterArchiveList(
	archives: readonly ArchiveListItem[],
	query: string,
): ArchiveListItem[] {
	const normalized = query.trim().toLowerCase();
	if (normalized.length === 0) {
		return [...archives];
	}
	return archives.filter((archive) =>
		`${readArchiveId(archive)} ${readArchiveTitle(archive)}`
			.toLowerCase()
			.includes(normalized),
	);
}

export function findArchiveById(
	archives: readonly ArchiveListItem[],
	liveId: string,
): ArchiveListItem | undefined {
	return archives.find((archive) => readArchiveId(archive) === liveId);
}

export function readArchiveId(archive: ArchiveListItem): string {
	const value = archive.archives_id;
	return typeof value === 'string' ? value : '';
}

export function readArchiveTitle(archive: ArchiveListItem): string {
	const value = archive.title ?? archive.name;
	return typeof value === 'string' ? value : '';
}

export function readArchiveNumber(
	archive: ArchiveListItem,
	key: string,
): number {
	const value = archive[key];
	return typeof value === 'number' ? value : 0;
}

function countEarnedStarsForArchive(
	archive: ArchiveListItem,
	point: ArchiveGiftPoint | undefined,
): number {
	if (point === undefined) {
		return 0;
	}
	return readArchiveGiftStarSegments(archive).filter(
		(segment) => point.totalUserGiftPoint >= segment,
	).length;
}

export function hasExtraAdmissionForArchive(
	archive: ArchiveListItem,
	point: ArchiveGiftPoint | undefined,
): boolean {
	const threshold = readArchiveNumber(
		archive,
		'gift_stars_threshold_for_extra_admission',
	);
	return (
		threshold > 0 && countEarnedStarsForArchive(archive, point) >= threshold
	);
}

export function isArchivePrizePresent(present: ArchivePrizePresent): boolean {
	return present.item_id === 2016001 && present.live_id.length > 0;
}

export function createArchivePrizeCandidates(
	archive: ArchiveListItem,
	memberFanLevels: readonly MemberFanLevel[] | undefined,
): ArchivePrizeCandidate[] {
	return readArchiveCharacterIds(archive).map((characterId) => {
		const memberFanLevel = memberFanLevels?.find(
			(entry) => entry.characterId === characterId,
		);
		return {
			characterId,
			memberFanLevel: memberFanLevel?.memberFanLevel ?? 1,
			memberFanExperience: memberFanLevel?.memberFanExperience ?? 0,
		};
	});
}

export function setArchivePrizeStarNum(
	form: ArchivePrizeStarForm,
	characterId: number,
	starNum: string,
): ArchivePrizeStarForm {
	return {
		...form,
		starNumsByCharacterId: {
			...form.starNumsByCharacterId,
			[characterId]: starNum,
		},
	};
}

export function sumSelectedStars(form: ArchivePrizeStarForm): number {
	return Object.values(form.starNumsByCharacterId).reduce(
		(sum, starNum) => sum + Number(starNum),
		0,
	);
}

export function canApplyArchiveStars(
	form: ArchivePrizeStarForm,
	total: number,
): boolean {
	return (
		Object.values(archivePrizeStarValues(form).starNumsByCharacterId).every(
			(value) => typeof value === 'number',
		) && sumSelectedStars(form) === total
	);
}

export function hasArchivePrizeStarFormChanges(
	source: ArchivePrizeStarForm,
	value: ArchivePrizeStarForm,
): boolean {
	return hasAdminDraftChanges(
		archivePrizeStarValues(source),
		archivePrizeStarValues(value),
	);
}

export function createArchivePrizeStarPostForm(
	form: ArchivePrizeStarForm,
	copy: AdminMessages['validation'],
): {
	presentBoxId: string;
	setStarJson: string;
} {
	const values = archivePrizeStarValues(form);
	const setStarInfoList: Array<{ character_id: number; set_star_num: number }> =
		[];
	for (const [key, starNum] of Object.entries(values.starNumsByCharacterId)) {
		if (typeof starNum !== 'number') throw new Error(copy.stars);
		const characterId = Number(key);
		if (Number.isSafeInteger(characterId))
			setStarInfoList.push({
				character_id: characterId,
				set_star_num: starNum,
			});
	}
	return {
		presentBoxId: form.presentBoxId,
		setStarJson: JSON.stringify({ set_star_info_list: setStarInfoList }),
	};
}

function archivePrizeStarValues(form: ArchivePrizeStarForm): {
	presentBoxId: string;
	starNumsByCharacterId: Record<string, number | string>;
} {
	const starNumsByCharacterId: Record<string, number | string> = {};
	for (const [key, raw] of Object.entries(form.starNumsByCharacterId)) {
		const parsed = parseSafeFormInteger(raw, 0);
		if (parsed !== 0) starNumsByCharacterId[key] = parsed ?? raw;
	}
	return { presentBoxId: form.presentBoxId, starNumsByCharacterId };
}

function readArchiveGiftStarSegments(archive: ArchiveListItem): number[] {
	const value = archive.gift_star_reward_segments;
	return Array.isArray(value)
		? value.filter(
				(segment): segment is number =>
					typeof segment === 'number' && Number.isSafeInteger(segment),
			)
		: [];
}

function readArchiveCharacterIds(archive: ArchiveListItem): number[] {
	const value = archive.character_list;
	if (!Array.isArray(value)) {
		return [];
	}
	return value
		.map((entry) =>
			isArchiveCharacterEntry(entry) ? entry.character_id : undefined,
		)
		.filter((characterId): characterId is number => characterId !== undefined);
}

function isArchiveCharacterEntry(
	value: unknown,
): value is { character_id: number } {
	if (!isRecord(value)) {
		return false;
	}
	return typeof value.character_id === 'number';
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}
