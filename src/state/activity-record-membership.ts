import type {
	ActivityRecordAdvMembership,
	ActivityRecordSeriesMembership,
} from './activity-record-types.ts';
import type {
	EntityIdentityFingerprint,
	EntityProvenance,
} from './entity-provenance.ts';
import { isSameEntityIdentity } from './entity-provenance.ts';

export function hasActivityRecordAdvMembership(
	legacyIds: readonly number[],
	memberships: readonly ActivityRecordAdvMembership[],
	advDataId: number,
	targetFingerprint: EntityIdentityFingerprint,
): boolean {
	return (
		legacyIds.includes(advDataId) ||
		memberships.some(
			(membership) =>
				membership.advDataId === advDataId &&
				isSameEntityIdentity(membership.identityFingerprint, targetFingerprint),
		)
	);
}

export function setActivityRecordAdvMembership(
	memberships: readonly ActivityRecordAdvMembership[],
	advDataId: number,
	shouldContain: boolean,
	provenance: EntityProvenance,
): ActivityRecordAdvMembership[] {
	const withoutTarget = memberships.filter(
		(membership) =>
			membership.advDataId !== advDataId ||
			!isSameEntityIdentity(
				membership.identityFingerprint,
				provenance.identityFingerprint,
			),
	);
	return shouldContain
		? [...withoutTarget, { advDataId, ...provenance }]
		: withoutTarget;
}

export function setActivityRecordSeriesMembership(
	memberships: readonly ActivityRecordSeriesMembership[],
	advSeriesId: number,
	shouldContain: boolean,
	provenance: EntityProvenance,
): ActivityRecordSeriesMembership[] {
	const withoutTarget = memberships.filter(
		(membership) =>
			membership.advSeriesId !== advSeriesId ||
			!isSameEntityIdentity(
				membership.identityFingerprint,
				provenance.identityFingerprint,
			),
	);
	return shouldContain
		? [...withoutTarget, { advSeriesId, ...provenance }]
		: withoutTarget;
}
