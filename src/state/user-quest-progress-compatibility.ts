import type { EntityIdentityFingerprint } from './entity-provenance.ts';
import { isSameEntityIdentity } from './entity-provenance.ts';

export function isQuestStageProgressCompatible(
	progress: { identityFingerprint?: EntityIdentityFingerprint },
	targetFingerprint: EntityIdentityFingerprint | undefined,
): boolean {
	return (
		targetFingerprint === undefined ||
		progress.identityFingerprint === undefined ||
		isSameEntityIdentity(progress.identityFingerprint, targetFingerprint)
	);
}

export function findCompatibleQuestStageProgress<
	T extends { identityFingerprint?: EntityIdentityFingerprint },
>(
	progresses: readonly T[],
	isSameStage: (progress: T) => boolean,
	targetFingerprint: EntityIdentityFingerprint,
): T | undefined {
	const sameStageProgresses = progresses.filter(isSameStage);
	return (
		sameStageProgresses.find((progress) =>
			isSameEntityIdentity(progress.identityFingerprint, targetFingerprint),
		) ??
		sameStageProgresses.find(
			(progress) => progress.identityFingerprint === undefined,
		)
	);
}
