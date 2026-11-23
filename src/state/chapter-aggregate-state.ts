import type { ActiveChapterMaster } from './chapter-definition.ts';
import type { UserChapterState } from './chapter-types.ts';
import type { EntityProvenance } from './entity-provenance.ts';
import { findCompatibleMasterBoundProgress } from './master-bound-progress.ts';

export function ensureUserChapterState(
	chapters: UserChapterState[],
	playerId: string,
	master: ActiveChapterMaster,
	provenance: EntityProvenance,
): { chapters: UserChapterState[]; chapter: UserChapterState } {
	const existing = findCompatibleMasterBoundProgress(
		chapters,
		(chapter) =>
			chapter.playerId === playerId && chapter.chapterId === master.chapterId,
		provenance.identityFingerprint,
	);
	if (existing !== undefined && existing.identityFingerprint !== undefined)
		return { chapters, chapter: existing };
	const chapter = createChapterFromMaster(
		playerId,
		master,
		provenance,
		existing,
	);
	return { chapters: [...chapters, chapter], chapter };
}

function createChapterFromMaster(
	playerId: string,
	master: ActiveChapterMaster,
	provenance: EntityProvenance,
	legacy: UserChapterState | undefined,
): UserChapterState {
	return {
		...provenance,
		playerId,
		chapterId: master.chapterId,
		currentPoint: legacy?.currentPoint ?? 0,
		categoryPoints: legacy?.categoryPoints.map((point) => ({ ...point })) ?? [],
		missionProgresses:
			legacy?.missionProgresses.map((progress) => ({ ...progress })) ?? [],
		claimedPointRewardIds: [...(legacy?.claimedPointRewardIds ?? [])],
	};
}
