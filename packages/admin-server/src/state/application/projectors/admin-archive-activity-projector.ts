import type { AdminVisibleServerState } from '@altair/runtime/admin/dto/admin-visible-state-schema.ts';
import { applyArchiveGiftProgressToArchiveList } from '../../../../../../src/application/archive-catalog-progress.ts';
import type { ServerState } from '../../../../../../src/server-state-schema.ts';
import { projectActivityRecordState } from '../../../../../../src/state/activity-record-projection.ts';
import { projectArchiveWatchedHistory } from '../../../../../../src/state/archive-watched-history.ts';
import { isSameEntityIdentity } from '../../../../../../src/state/entity-provenance.ts';
import type { AdminArchiveActivityReader } from '../admin-archive-activity-ports.ts';

export function projectActivityRecordsForAdmin(
	state: Pick<ServerState, 'userActivityRecords'>,
	reader: AdminArchiveActivityReader,
): AdminVisibleServerState['userActivityRecords'] {
	const identityCatalog = reader.readActivityRecordIdentityCatalog();
	return state.userActivityRecords.map((record) =>
		projectActivityRecordState(record, identityCatalog),
	);
}

export function projectArchiveCollectionsForAdmin(
	state: Pick<ServerState, 'userArchiveCollections' | 'archiveGiftPoints'>,
	reader: AdminArchiveActivityReader,
): ServerState['userArchiveCollections'] {
	const archiveList = reader.readArchiveList();
	const identityCatalog = reader.readArchiveWatchedIdentityCatalog();
	return state.userArchiveCollections.map((collection) => {
		const visible = {
			...collection,
			...projectArchiveWatchedHistory(collection, identityCatalog),
			archiveList: applyArchiveGiftProgressToArchiveList(
				archiveList.map((archive) => ({ ...archive })),
				state.archiveGiftPoints,
				collection.playerId,
				(liveId) => reader.findArchivePrizeMaster(liveId),
				(liveId) => reader.findGiftLiveIdentityFingerprint('withlive', liveId),
			),
		};
		delete visible.watchedWithliveArchiveMemberships;
		delete visible.watchedFesArchiveMemberships;
		return visible;
	});
}

export function projectArchiveGiftPointsForAdmin(
	state: Pick<ServerState, 'archiveGiftPoints'>,
	reader: AdminArchiveActivityReader,
): ServerState['archiveGiftPoints'] {
	return state.archiveGiftPoints.flatMap((point) => {
		const targetFingerprint =
			point.identityFingerprint?.domain === 'withstation-gift-live'
				? reader.findGiftLiveIdentityFingerprint('withstation', point.liveId)
				: (reader.findGiftLiveIdentityFingerprint('withlive', point.liveId) ??
					reader.findGiftLiveIdentityFingerprint('withstation', point.liveId));
		if (
			targetFingerprint === undefined ||
			(point.identityFingerprint !== undefined &&
				!isSameEntityIdentity(point.identityFingerprint, targetFingerprint))
		)
			return [];
		const visible = { ...point };
		delete visible.sourceMasterReleaseId;
		delete visible.identityFingerprint;
		return [visible];
	});
}
