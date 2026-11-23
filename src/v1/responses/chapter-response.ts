import type {
	ActiveChapterMaster,
	ChapterMission,
	ChapterPointReward,
	ChapterRankMaster,
} from '../../state/chapter-definition.ts';
import { chapterRewardStatus } from '../../state/chapter-reward-claim-state.ts';
import type { UserChapterState } from '../../state/chapter-types.ts';
import type {
	ChapterCategoryInfoResponse,
	ChapterHomeResponse,
	ChapterPointRewardsResponse,
} from '../response-types/archive-chapter-login-response-types.ts';

export function createChapterHomeResponse(
	chapter: UserChapterState,
	master: ActiveChapterMaster,
	rank: ChapterRankMaster,
): ChapterHomeResponse {
	return {
		chapter_id: chapter.chapterId,
		rank_info: {
			current_point: chapter.currentPoint,
			current_rank: rank.currentRank,
			is_max_rank: rank.isMaxRank,
		},
		category_list: master.categoryPoints.map((category) => ({
			category_id: category.categoryId,
			current_point:
				chapter.categoryPoints.find(
					(progress) => progress.categoryId === category.categoryId,
				)?.currentPoint ?? 0,
			max_point: category.maxPoint,
			is_capped: category.isCapped,
		})),
	};
}

export function createChapterPointRewardsResponse(
	chapter: UserChapterState,
	rewards: ChapterPointReward[],
): ChapterPointRewardsResponse<ChapterPointReward> {
	return {
		point_reward: rewards.map((reward) => ({
			...reward,
			status: chapterRewardStatus(
				chapter,
				reward.chapter_point_rewards_id,
				reward.required_point,
			),
		})),
	};
}

export function createChapterCategoryInfoResponse(
	chapter: UserChapterState,
	categoryId: number,
	master: ActiveChapterMaster,
	missions: ChapterMission[],
): ChapterCategoryInfoResponse<ChapterMission> | undefined {
	const category = master.categoryPoints.find(
		(categoryPoint) => categoryPoint.categoryId === categoryId,
	);
	if (!category) {
		return undefined;
	}
	return {
		category_info: {
			category_id: category.categoryId,
			current_point:
				chapter.categoryPoints.find(
					(progress) => progress.categoryId === category.categoryId,
				)?.currentPoint ?? 0,
			max_point: category.maxPoint,
			is_capped: category.isCapped,
		},
		mission_list: createChapterMissionList(chapter, missions),
	};
}

function createChapterMissionList(
	chapter: UserChapterState,
	missions: ChapterMission[],
): ChapterMission[] {
	return missions.map((mission) => {
		const progress = chapter.missionProgresses.find(
			(entry) => entry.missionId === mission.mission_id,
		);
		if (!progress) {
			return mission;
		}
		return {
			...mission,
			achieved_num: progress.achievedNum,
			is_achieved: progress.isAchieved,
			is_received: progress.isReceived,
		};
	});
}
