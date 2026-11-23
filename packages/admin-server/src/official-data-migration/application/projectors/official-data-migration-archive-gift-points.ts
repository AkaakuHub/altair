import type { ArchiveGiftPointState } from '../../../../../../src/state/archive-gift-state.ts';
import {
	type JsonRecord,
	type OfficialApiDumpEvent,
	type OfficialDataMigrationDump,
	readNumber,
	readRecord,
	readRecordArray,
	readString,
} from '../official-data-migration-dump.ts';

export function createArchiveGiftPointsFromDump(
	playerId: string,
	dump: OfficialDataMigrationDump,
): ArchiveGiftPointState[] {
	const archiveStarCounts = collectArchiveStarCounts(dump.events);
	const archivePrizeLiveIds = collectArchivePrizePresentLiveIds(
		dump.responsesByPath.get('/v1/present_box/get_list'),
	);
	return dump.events
		.filter(isSuccessfulArchiveGiftPointSource)
		.map((event) =>
			createArchiveGiftPoint(
				playerId,
				event,
				archivePrizeLiveIds,
				archiveStarCounts,
			),
		)
		.filter((point): point is ArchiveGiftPointState => point !== null);
}

function isSuccessfulArchiveGiftPointSource(
	event: OfficialApiDumpEvent,
): event is OfficialApiDumpEvent & { response: JsonRecord } {
	return (
		event.response !== null &&
		isSuccessfulStatus(event) &&
		[
			'/v1/archive/get_with_archive_data',
			'/v1/archive/withlive_info',
			'/v1/archive/withlive_prize',
			'/v1/archive/get_with_station_data',
		].includes(event.path ?? '')
	);
}

function createArchiveGiftPoint(
	playerId: string,
	event: OfficialApiDumpEvent & { response: JsonRecord },
	archivePrizeLiveIds: readonly string[],
	archiveStarCounts: ReadonlyMap<string, number>,
): ArchiveGiftPointState | null {
	const response = event.response;
	const liveId =
		readArchiveId(response) ||
		readArchiveId(event.request) ||
		(event.path === '/v1/archive/withlive_prize' &&
		archivePrizeLiveIds.length === 1
			? readOnlyArchivePrizeLiveId(archivePrizeLiveIds)
			: '');
	const totalUserGiftPoint =
		readNumber(response.user_gift_pt_including_archive) ??
		readNumber(response.total_user_gift_pt) ??
		readNumber(response.user_gift_pt);
	if (liveId.length === 0 || totalUserGiftPoint === null) {
		return null;
	}
	const starInfo = readRecord(response.star_info);
	return {
		playerId,
		liveId,
		totalUserGiftPoint,
		totalUserGiftPointWithoutArchive:
			readNumber(response.user_gift_pt_without_archive) ?? 0,
		awardedArchivePrizeStarCount:
			readNumber(starInfo?.star_num) ??
			readNumber(response.earned_star_count) ??
			archiveStarCounts.get(liveId) ??
			0,
		allocatedArchivePrizeStarCount: 0,
	};
}

function readOnlyArchivePrizeLiveId(liveIds: readonly string[]): string {
	const liveId = liveIds[0];
	return liveIds.length === 1 && liveId !== undefined ? liveId : '';
}

function collectArchiveStarCounts(
	events: readonly OfficialApiDumpEvent[],
): Map<string, number> {
	const counts = new Map<string, number>();
	for (const event of events) {
		if (
			event.path !== '/v1/archive/get_archive_list' ||
			event.response === null ||
			!isSuccessfulStatus(event)
		) {
			continue;
		}
		for (const archive of readRecordArray(event.response.archive_list)) {
			const archiveId = readArchiveId(archive);
			const starCount = readNumber(archive.earned_star_count);
			if (archiveId.length > 0 && starCount !== null) {
				counts.set(archiveId, starCount);
			}
		}
	}
	return counts;
}

function collectArchivePrizePresentLiveIds(
	presentBoxListResponse: JsonRecord | undefined,
): string[] {
	const liveIds = new Set<string>();
	for (const present of readRecordArray(presentBoxListResponse?.items)) {
		if (readNumber(present.item_id) !== 2016001) {
			continue;
		}
		const liveId = readString(present.live_id);
		if (liveId !== null) {
			liveIds.add(liveId);
		}
	}
	return [...liveIds];
}

function readArchiveId(value: unknown): string {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		return '';
	}
	const record = value as JsonRecord;
	return (
		readString(record.archives_id) ??
		readString(record.archive_id) ??
		readString(record.live_id) ??
		readString(record.present_box_id) ??
		''
	);
}

function isSuccessfulStatus(event: OfficialApiDumpEvent): boolean {
	return (
		event.statusCode === null ||
		(event.statusCode >= 200 && event.statusCode < 400)
	);
}
