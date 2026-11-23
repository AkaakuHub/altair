import type { UserArchiveCollectionState } from './archive-collection-definition.ts';

export function setCurrentWithliveArchive(
	collection: UserArchiveCollectionState,
	archiveId: string,
	masterReleaseId: string,
	currentPlayTimeSecond: number,
	mainStartSecond: number,
	commentOffsetSecond: number,
	startedAt: Date,
): boolean {
	if (archiveId.length === 0) return false;
	const previous = [
		collection.currentWithliveArchiveId,
		collection.currentWithliveArchiveMasterReleaseId,
		collection.currentWithliveArchiveStartSecond,
		collection.currentWithliveArchiveStartedAt,
		collection.currentWithliveArchiveMainStartSecond,
		collection.currentWithliveArchiveCommentOffsetSecond,
	];
	const nextStartedAt = startedAt.toISOString();
	collection.currentWithliveArchiveId = archiveId;
	collection.currentWithliveArchiveMasterReleaseId = masterReleaseId;
	collection.currentWithliveArchiveStartSecond = currentPlayTimeSecond;
	collection.currentWithliveArchiveStartedAt = nextStartedAt;
	collection.currentWithliveArchiveMainStartSecond = mainStartSecond;
	collection.currentWithliveArchiveCommentOffsetSecond = commentOffsetSecond;
	return (
		previous[0] !== archiveId ||
		previous[1] !== masterReleaseId ||
		previous[2] !== currentPlayTimeSecond ||
		previous[3] !== nextStartedAt ||
		previous[4] !== mainStartSecond ||
		previous[5] !== commentOffsetSecond
	);
}

export function readCurrentWithliveArchiveSecond(
	collection: UserArchiveCollectionState,
	now: Date,
): { liveId: string; playTimeSecond: number } | undefined {
	const liveId = collection.currentWithliveArchiveId;
	if (typeof liveId !== 'string' || liveId.length === 0) return undefined;
	return {
		liveId,
		playTimeSecond: toWithliveArchiveCommentSecond(
			collection,
			liveId,
			readElapsedPlayTimeSecond(collection, now),
		),
	};
}

export function setCurrentWithstationArchive(
	collection: UserArchiveCollectionState,
	liveId: string,
	masterReleaseId: string,
	currentPlayTimeSecond: number,
	startedAt: Date,
): boolean {
	if (liveId.length === 0) return false;
	const nextStartedAt = startedAt.toISOString();
	const nextStartMillisecond = currentPlayTimeSecond * 1000;
	const changed =
		collection.currentWithstationArchiveId !== liveId ||
		collection.currentWithstationArchiveMasterReleaseId !== masterReleaseId ||
		collection.currentWithstationArchiveStartedAt !== nextStartedAt ||
		collection.currentWithstationArchiveStartMillisecond !==
			nextStartMillisecond;
	collection.currentWithstationArchiveId = liveId;
	collection.currentWithstationArchiveMasterReleaseId = masterReleaseId;
	collection.currentWithstationArchiveStartedAt = nextStartedAt;
	collection.currentWithstationArchiveStartMillisecond = nextStartMillisecond;
	return changed;
}

export function readCurrentWithstationArchiveMillisecond(
	collection: UserArchiveCollectionState,
	now: Date,
): { liveId: string; playTimeMillisecond: number } | undefined {
	const liveId = collection.currentWithstationArchiveId;
	if (typeof liveId !== 'string' || liveId.length === 0) return undefined;
	const baseMillisecond =
		collection.currentWithstationArchiveStartMillisecond ?? 0;
	const startedAt = readStartedAt(
		collection.currentWithstationArchiveStartedAt,
	);
	return {
		liveId,
		playTimeMillisecond:
			startedAt === undefined
				? baseMillisecond
				: Math.max(0, baseMillisecond + now.getTime() - startedAt),
	};
}

export function toWithliveArchiveCommentSecond(
	collection: UserArchiveCollectionState,
	liveId: string,
	playTimeSecond: number,
): number {
	if (collection.currentWithliveArchiveId !== liveId) return playTimeSecond;
	return Math.max(
		0,
		playTimeSecond -
			(collection.currentWithliveArchiveCommentOffsetSecond ?? 0),
	);
}

function readElapsedPlayTimeSecond(
	collection: UserArchiveCollectionState,
	now: Date,
): number {
	const baseSecond = collection.currentWithliveArchiveStartSecond ?? 0;
	const startedAt = readStartedAt(collection.currentWithliveArchiveStartedAt);
	if (startedAt === undefined) return baseSecond;
	return (
		baseSecond + Math.max(0, Math.floor((now.getTime() - startedAt) / 1000))
	);
}

function readStartedAt(value: string | undefined): number | undefined {
	if (value === undefined) return undefined;
	const startedAt = Date.parse(value);
	return Number.isNaN(startedAt) ? undefined : startedAt;
}
