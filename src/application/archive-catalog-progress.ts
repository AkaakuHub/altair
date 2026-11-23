import {
	type ArchiveGiftPointState,
	findArchiveGiftPoint,
} from '../state/archive-gift-state.ts';
import type { ArchivePrizeMaster } from '../state/archive-prize-definition.ts';
import type { EntityIdentityFingerprint } from '../state/entity-provenance.ts';
import type { JsonObject } from '../state/json-state-utils.ts';
import {
	getEarnedArchivePrizeStarCount,
	hasArchiveExtraAdmission,
} from './archive-prize-progress.ts';

export function applyArchiveGiftProgressToArchiveList<T extends JsonObject>(
	archiveList: T[],
	archiveGiftPoints: readonly ArchiveGiftPointState[],
	playerId: string,
	findArchivePrizeMaster: (archiveId: string) => ArchivePrizeMaster | undefined,
	findArchiveFingerprint: (
		archiveId: string,
	) => EntityIdentityFingerprint | undefined,
): T[] {
	return archiveList.map((archive) =>
		applyArchiveGiftProgressToArchive(
			archive,
			archiveGiftPoints,
			playerId,
			findArchivePrizeMaster,
			findArchiveFingerprint,
		),
	);
}

function applyArchiveGiftProgressToArchive<T extends JsonObject>(
	archive: T,
	archiveGiftPoints: readonly ArchiveGiftPointState[],
	playerId: string,
	findArchivePrizeMaster: (archiveId: string) => ArchivePrizeMaster | undefined,
	findArchiveFingerprint: (
		archiveId: string,
	) => EntityIdentityFingerprint | undefined,
): T {
	const archiveId = readArchiveId(archive);
	if (archiveId.length === 0) {
		return archive;
	}
	const master = findArchivePrizeMaster(archiveId);
	if (master === undefined) {
		return archive;
	}
	const point = findArchiveGiftPoint(
		archiveGiftPoints,
		playerId,
		archiveId,
		findArchiveFingerprint(archiveId),
	);
	const progress: JsonObject = archive;
	progress.earned_star_count =
		getEarnedArchivePrizeStarCount(point, master) ?? 0;
	progress.has_extra_admission = hasArchiveExtraAdmission(point, master);
	return archive;
}

function readArchiveId(archive: JsonObject): string {
	const archiveId = archive.archives_id;
	return typeof archiveId === 'string' ? archiveId : '';
}
