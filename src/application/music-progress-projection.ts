import type { EntityIdentityFingerprint } from '../state/entity-provenance.ts';
import { findCompatibleMasterBoundProgress } from '../state/master-bound-progress.ts';

type MusicProgress = {
	musicId: number;
	identityFingerprint?: EntityIdentityFingerprint;
};

export function findCompatibleMusicProgress<T extends MusicProgress>(
	progresses: readonly T[],
	musicId: number,
	targetFingerprint: EntityIdentityFingerprint,
): T | undefined {
	return findCompatibleMasterBoundProgress(
		progresses,
		(progress) => progress.musicId === musicId,
		targetFingerprint,
	);
}

export function projectCompatibleMusicProgresses<T extends MusicProgress>(
	progresses: readonly T[],
	targetFingerprints: ReadonlyMap<number, EntityIdentityFingerprint>,
): T[] {
	return [...targetFingerprints.entries()].flatMap(([musicId, fingerprint]) => {
		const progress = findCompatibleMusicProgress(
			progresses,
			musicId,
			fingerprint,
		);
		return progress === undefined ? [] : [progress];
	});
}
