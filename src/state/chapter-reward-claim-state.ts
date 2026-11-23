import type {
	ActiveChapterMaster,
	ChapterPointReward,
} from './chapter-definition.ts';
import type { UserChapterState } from './chapter-types.ts';

export function claimChapterPointRewards(
	chapter: UserChapterState,
	rewards: ChapterPointReward[],
	currentPoint: number,
	categoryMasters: ActiveChapterMaster['categoryPoints'],
): { claimedRewardIds: number[] } {
	chapter.currentPoint = Math.max(chapter.currentPoint, currentPoint);
	for (const master of categoryMasters) {
		if (master.isCapped) continue;
		const categoryPoint = Math.min(master.maxPoint, chapter.currentPoint);
		const category = chapter.categoryPoints.find(
			(candidate) => candidate.categoryId === master.categoryId,
		);
		if (category !== undefined) category.currentPoint = categoryPoint;
		else if (categoryPoint > 0)
			chapter.categoryPoints.push({
				categoryId: master.categoryId,
				currentPoint: categoryPoint,
			});
	}
	const receivableIds = rewards
		.filter(
			(reward) =>
				chapterRewardStatus(
					chapter,
					reward.chapter_point_rewards_id,
					reward.required_point,
				) === 2,
		)
		.map((reward) => reward.chapter_point_rewards_id)
		.filter((rewardId) => rewardId > 0);
	chapter.claimedPointRewardIds = [
		...new Set([...chapter.claimedPointRewardIds, ...receivableIds]),
	];
	return { claimedRewardIds: receivableIds };
}

export function chapterRewardStatus(
	chapter: UserChapterState,
	rewardId: number,
	requiredPoint: number,
): number {
	if (chapter.claimedPointRewardIds.includes(rewardId)) return 3;
	return chapter.currentPoint >= requiredPoint ? 2 : 1;
}
