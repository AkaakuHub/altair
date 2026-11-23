import type { EntityIdentityFingerprint } from '../state/entity-provenance.ts';
import { isSameEntityIdentity } from '../state/entity-provenance.ts';

type MasterBoundCanonicalEntry = Readonly<{
	definitionId: number;
	identityFingerprint: EntityIdentityFingerprint;
}>;

export type ActiveMasterIdentity = Readonly<{
	releaseId: string;
	databaseFingerprint: string;
	entityFingerprints: ReadonlyMap<number, EntityIdentityFingerprint>;
}>;

type ActiveMasterCanonicalProjection<T> = Readonly<{
	activeMaster: Readonly<{
		releaseId: string;
		databaseFingerprint: string;
	}>;
	visibleEntries: T[];
	hiddenEntries: T[];
}>;

export function projectCanonicalStateForActiveMaster<
	T extends MasterBoundCanonicalEntry,
>(
	canonicalEntries: readonly T[],
	activeMaster: ActiveMasterIdentity,
): ActiveMasterCanonicalProjection<T> {
	const visibleEntries: T[] = [];
	const hiddenEntries: T[] = [];
	for (const entry of canonicalEntries) {
		const activeFingerprint = activeMaster.entityFingerprints.get(
			entry.definitionId,
		);
		const target =
			activeFingerprint !== undefined &&
			isSameEntityIdentity(entry.identityFingerprint, activeFingerprint)
				? visibleEntries
				: hiddenEntries;
		target.push(structuredClone(entry));
	}
	return {
		activeMaster: {
			releaseId: activeMaster.releaseId,
			databaseFingerprint: activeMaster.databaseFingerprint,
		},
		visibleEntries,
		hiddenEntries,
	};
}
