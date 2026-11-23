import type { Database } from 'bun:sqlite';
import type {
	EntityIdentityFingerprint,
	EntityProvenance,
} from '../state/entity-provenance.ts';

export type WatchedArchiveType = 'fes' | 'withlive';
type GiftLiveType = 'withlive' | 'withstation';

type ArchiveIdentityRow = {
	archives_id: string;
	content_code: number;
	characters: string | null;
	costume_ids: string | null;
	live_location_id: number;
	selectable_camera_types: string | null;
	timeline_ids: string | null;
	has_extra: number;
	is_horizontal: number;
	live_type: number | null;
};

export function getArchiveIdentityFingerprints(
	database: Database,
	archiveType: WatchedArchiveType,
): ReadonlyMap<string, EntityIdentityFingerprint> {
	return new Map(
		readArchiveIdentityRows(database).map((row) => [
			row.archives_id,
			createArchiveIdentityFingerprint(archiveType, row),
		]),
	);
}

export function getArchiveProvenance(
	database: Database,
	masterReleaseId: string,
	archiveType: WatchedArchiveType,
	archiveId: string,
): EntityProvenance | undefined {
	const identityFingerprint = getArchiveIdentityFingerprints(
		database,
		archiveType,
	).get(archiveId);
	return identityFingerprint === undefined
		? undefined
		: { sourceMasterReleaseId: masterReleaseId, identityFingerprint };
}

export function getGiftLiveProvenance(
	database: Database,
	masterReleaseId: string,
	liveType: GiftLiveType,
	liveId: string,
): EntityProvenance | undefined {
	const identityFingerprint =
		liveType === 'withlive'
			? getArchiveIdentityFingerprints(database, 'withlive').get(liveId)
			: getWithstationIdentityFingerprint(database, liveId);
	return identityFingerprint === undefined
		? undefined
		: { sourceMasterReleaseId: masterReleaseId, identityFingerprint };
}

export function getGiftLiveIdentityFingerprint(
	database: Database,
	liveType: GiftLiveType,
	liveId: string,
): EntityIdentityFingerprint | undefined {
	return liveType === 'withlive'
		? getArchiveIdentityFingerprints(database, 'withlive').get(liveId)
		: getWithstationIdentityFingerprint(database, liveId);
}

export function createArchiveIdentityFingerprint(
	archiveType: WatchedArchiveType,
	row: ArchiveIdentityRow,
): EntityIdentityFingerprint {
	return {
		domain: `${archiveType}-archive`,
		value: JSON.stringify([
			row.archives_id,
			row.content_code,
			readSortedIdentityValues(row.characters),
			readSortedIdentityValues(row.costume_ids),
			row.live_location_id,
			readSortedIdentityValues(row.selectable_camera_types),
			readSortedIdentityValues(row.timeline_ids),
			row.has_extra,
			row.is_horizontal,
			row.live_type,
		]),
	};
}

function readArchiveIdentityRows(database: Database): ArchiveIdentityRow[] {
	return database
		.query<ArchiveIdentityRow, []>(
			[
				'SELECT detail.archives_id, detail.content_code, detail.characters,',
				'detail.costume_ids, detail.live_location_id,',
				'detail.selectable_camera_types, detail.timeline_ids,',
				'detail.has_extra, detail.is_horizontal, list.live_type',
				'FROM archive_detail AS detail',
				'LEFT JOIN archive_list AS list ON list.archives_id = detail.archives_id',
				'ORDER BY detail.archives_id',
			].join(' '),
		)
		.all();
}

function getWithstationIdentityFingerprint(
	database: Database,
	liveId: string,
): EntityIdentityFingerprint | undefined {
	const row = database
		.query<
			{
				live_id: string;
				content_code: number;
				characters: string | null;
				costume_ids: string | null;
				live_location_id: number;
				timeline_ids: string | null;
				has_extra: number;
				is_horizontal: number;
			},
			[string]
		>(
			[
				'SELECT live_id, content_code, characters, costume_ids,',
				'live_location_id, timeline_ids, has_extra, is_horizontal',
				'FROM with_station_detail WHERE live_id = ?',
			].join(' '),
		)
		.get(liveId);
	if (row === null) return undefined;
	return {
		domain: 'withstation-gift-live',
		value: JSON.stringify([
			row.live_id,
			row.content_code,
			readSortedIdentityValues(row.characters),
			readSortedIdentityValues(row.costume_ids),
			row.live_location_id,
			readSortedIdentityValues(row.timeline_ids),
			row.has_extra,
			row.is_horizontal,
		]),
	};
}

function readSortedIdentityValues(value: string | null): string[] | null {
	if (value === null) return null;
	const parsed = JSON.parse(value) as unknown;
	if (!Array.isArray(parsed)) {
		throw new Error('Archive identity list must be a JSON array');
	}
	return parsed.map((entry) => JSON.stringify(entry)).sort();
}
