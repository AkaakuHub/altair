import type {
	ActivityRecordAdvMembership,
	ActivityRecordSeriesMembership,
	ActivityRecordVisibleState,
	UserActivityRecordState,
} from './activity-record-types.ts';
import type { EntityIdentityFingerprint } from './entity-provenance.ts';
import { isSameEntityIdentity } from './entity-provenance.ts';

type ActivityRecordIdentityCatalog = Readonly<{
	advFingerprints: ReadonlyMap<number, EntityIdentityFingerprint>;
	seriesFingerprints: ReadonlyMap<number, EntityIdentityFingerprint>;
}>;

export function projectActivityRecordState(
	activityRecord: UserActivityRecordState,
	identityCatalog: ActivityRecordIdentityCatalog,
): ActivityRecordVisibleState {
	return {
		playerId: activityRecord.playerId,
		watchedActivityRecordAdvDataIds: projectAdvIds(
			activityRecord.watchedActivityRecordAdvDataIds,
			activityRecord.watchedActivityRecordAdvMemberships ?? [],
			identityCatalog.advFingerprints,
		),
		displayedActivityRecordAdvSeriesIds: projectSeriesIds(
			activityRecord.displayedActivityRecordAdvSeriesIds,
			activityRecord.displayedActivityRecordAdvSeriesMemberships ?? [],
			identityCatalog.seriesFingerprints,
		),
		unlockedActivityRecordAdvDataIds: projectAdvIds(
			activityRecord.unlockedActivityRecordAdvDataIds,
			activityRecord.unlockedActivityRecordAdvMemberships ?? [],
			identityCatalog.advFingerprints,
		),
	};
}

function projectAdvIds(
	legacyIds: readonly number[],
	memberships: readonly ActivityRecordAdvMembership[],
	targetFingerprints: ReadonlyMap<number, EntityIdentityFingerprint>,
): number[] {
	return uniqueIds([
		...legacyIds.filter((id) => targetFingerprints.has(id)),
		...memberships
			.filter((membership) => {
				const target = targetFingerprints.get(membership.advDataId);
				return (
					target !== undefined &&
					isSameEntityIdentity(membership.identityFingerprint, target)
				);
			})
			.map((membership) => membership.advDataId),
	]);
}

function projectSeriesIds(
	legacyIds: readonly number[],
	memberships: readonly ActivityRecordSeriesMembership[],
	targetFingerprints: ReadonlyMap<number, EntityIdentityFingerprint>,
): number[] {
	return uniqueIds([
		...legacyIds.filter((id) => targetFingerprints.has(id)),
		...memberships
			.filter((membership) => {
				const target = targetFingerprints.get(membership.advSeriesId);
				return (
					target !== undefined &&
					isSameEntityIdentity(membership.identityFingerprint, target)
				);
			})
			.map((membership) => membership.advSeriesId),
	]);
}

function uniqueIds(ids: readonly number[]): number[] {
	return [...new Set(ids)];
}
