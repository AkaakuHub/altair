import type { ChapterRankMaster } from './chapter-definition.ts';
import type { UserChapterState } from './chapter-types.ts';

type ChapterRankResolver = (currentPoint: number) => ChapterRankMaster;

export function getRequestUserChapterHeader(
	state: { userChapters: UserChapterState[] },
	playerId: string,
	activeChapterId: number,
	resolveChapterRank: ChapterRankResolver,
): { currentRank: number; currentPoint: number } | undefined {
	const chapter = state.userChapters.find(
		(value) =>
			value.playerId === playerId && value.chapterId === activeChapterId,
	);
	if (chapter === undefined) return undefined;
	return {
		currentRank: resolveChapterRank(chapter.currentPoint).currentRank,
		currentPoint: chapter.currentPoint,
	};
}

export function setChapterMissionProgress(
	chapter: UserChapterState,
	missionId: number,
	achievedNum: number,
	isAchieved: boolean,
	isReceived: boolean,
): boolean {
	if (
		!Number.isSafeInteger(missionId) ||
		missionId <= 0 ||
		!Number.isSafeInteger(achievedNum) ||
		achievedNum < 0
	)
		return false;
	chapter.missionProgresses = [
		...chapter.missionProgresses.filter(
			(progress) => progress.missionId !== missionId,
		),
		{ missionId, achievedNum, isAchieved, isReceived },
	].sort((left, right) => left.missionId - right.missionId);
	return true;
}
