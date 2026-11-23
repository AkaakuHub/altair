import type { EntityIdentityFingerprint } from './entity-provenance.ts';
import { isSameEntityIdentity } from './entity-provenance.ts';

type MasterBoundProgress = {
	identityFingerprint?: EntityIdentityFingerprint;
};

export function findCompatibleMasterBoundProgress<
	T extends MasterBoundProgress,
>(
	progresses: readonly T[],
	isSameDefinitionId: (progress: T) => boolean,
	targetFingerprint: EntityIdentityFingerprint,
): T | undefined {
	const sameDefinitionProgresses = progresses.filter(isSameDefinitionId);
	return (
		sameDefinitionProgresses.find((progress) =>
			isSameEntityIdentity(progress.identityFingerprint, targetFingerprint),
		) ??
		sameDefinitionProgresses.find(
			(progress) => progress.identityFingerprint === undefined,
		)
	);
}
