import { isRecord } from '../state/json-state-utils.ts';

export function migrateRawChapterStates(state: Record<string, unknown>): void {
	if (!Array.isArray(state.userChapters)) return;
	for (const chapter of state.userChapters) {
		if (!isRecord(chapter)) continue;
		delete chapter.currentRank;
		delete chapter.isMaxRank;
		if (!Array.isArray(chapter.categoryPoints)) continue;
		const categoryPoints = chapter.categoryPoints.filter(
			(category) =>
				!isRecord(category) ||
				typeof category.currentPoint !== 'number' ||
				category.currentPoint !== 0,
		);
		chapter.categoryPoints = categoryPoints;
		for (const category of categoryPoints) {
			if (!isRecord(category)) continue;
			delete category.maxPoint;
			delete category.isCapped;
		}
	}
}

export function migrateRawGradeQuestStates(
	state: Record<string, unknown>,
): void {
	if (!Array.isArray(state.userLives)) return;
	for (const userLive of state.userLives) {
		if (!isRecord(userLive) || !isRecord(userLive.currentGradeQuest)) continue;
		const gradeQuest = userLive.currentGradeQuest;
		delete gradeQuest.active;
		delete gradeQuest.characterId;
		delete gradeQuest.generation;
		delete gradeQuest.rewardsJson;
		if (!Array.isArray(gradeQuest.squares)) continue;
		for (const square of gradeQuest.squares) {
			if (!isRecord(square)) continue;
			delete square.squareType;
			delete square.targetId;
			delete square.actionPointCost;
			delete square.openSquareIds;
		}
	}
}
