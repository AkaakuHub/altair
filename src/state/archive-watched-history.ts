import type {
	UserArchiveCollectionState,
	WatchedArchiveMembership,
} from './archive-collection-definition.ts';
import type {
	EntityIdentityFingerprint,
	EntityProvenance,
} from './entity-provenance.ts';
import { isSameEntityIdentity } from './entity-provenance.ts';

type ArchiveWatchedIdentityCatalog = Readonly<{
	withliveFingerprints: ReadonlyMap<string, EntityIdentityFingerprint>;
	fesFingerprints: ReadonlyMap<string, EntityIdentityFingerprint>;
}>;

export type VisibleArchiveWatchedHistory = Pick<
	UserArchiveCollectionState,
	| 'playerId'
	| 'watchedWithliveArchiveIds'
	| 'watchedFesArchiveIds'
	| 'userStickerStates'
>;

export function projectArchiveWatchedHistory(
	collection: UserArchiveCollectionState,
	identityCatalog: ArchiveWatchedIdentityCatalog,
): VisibleArchiveWatchedHistory {
	return {
		playerId: collection.playerId,
		watchedWithliveArchiveIds: projectWatchedArchiveIds(
			collection.watchedWithliveArchiveIds,
			collection.watchedWithliveArchiveMemberships ?? [],
			identityCatalog.withliveFingerprints,
		),
		watchedFesArchiveIds: projectWatchedArchiveIds(
			collection.watchedFesArchiveIds,
			collection.watchedFesArchiveMemberships ?? [],
			identityCatalog.fesFingerprints,
		),
		userStickerStates: collection.userStickerStates,
	};
}

export function markWithliveArchiveWatched(
	collection: UserArchiveCollectionState,
	archiveId: string,
	provenance: EntityProvenance,
): boolean {
	const result = addWatchedArchiveMembership(
		collection.watchedWithliveArchiveMemberships ?? [],
		archiveId,
		provenance,
	);
	collection.watchedWithliveArchiveMemberships = result.memberships;
	return result.changed;
}

export function markFesArchiveWatched(
	collection: UserArchiveCollectionState,
	archiveId: string,
	provenance: EntityProvenance,
): boolean {
	const result = addWatchedArchiveMembership(
		collection.watchedFesArchiveMemberships ?? [],
		archiveId,
		provenance,
	);
	collection.watchedFesArchiveMemberships = result.memberships;
	return result.changed;
}

function projectWatchedArchiveIds(
	legacyIds: readonly string[],
	memberships: readonly WatchedArchiveMembership[],
	targetFingerprints: ReadonlyMap<string, EntityIdentityFingerprint>,
): string[] {
	return [
		...new Set([
			...legacyIds.filter((archiveId) => targetFingerprints.has(archiveId)),
			...memberships
				.filter((membership) => {
					const target = targetFingerprints.get(membership.archiveId);
					return (
						target !== undefined &&
						isSameEntityIdentity(membership.identityFingerprint, target)
					);
				})
				.map((membership) => membership.archiveId),
		]),
	];
}

function addWatchedArchiveMembership(
	memberships: readonly WatchedArchiveMembership[],
	archiveId: string,
	provenance: EntityProvenance,
): { memberships: WatchedArchiveMembership[]; changed: boolean } {
	if (archiveId.length === 0)
		return { memberships: [...memberships], changed: false };
	const exists = memberships.some(
		(membership) =>
			membership.archiveId === archiveId &&
			isSameEntityIdentity(
				membership.identityFingerprint,
				provenance.identityFingerprint,
			),
	);
	if (exists) return { memberships: [...memberships], changed: false };
	return {
		memberships: [...memberships, { archiveId, ...provenance }],
		changed: true,
	};
}
