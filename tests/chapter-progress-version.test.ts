import { describe, expect, test } from 'bun:test';
import { createChapterIdentityFingerprint } from '../src/master-data/chapter-identity.ts';
import { ensureUserChapterState } from '../src/state/chapter-aggregate-state.ts';

const master = {
	chapterId: 1,
	categoryPoints: [{ categoryId: 10, maxPoint: 100, isCapped: false }],
};
const oldProvenance = {
	sourceMasterReleaseId: 'old',
	identityFingerprint: { domain: 'chapter', value: 'old' },
};
const newProvenance = {
	sourceMasterReleaseId: 'new',
	identityFingerprint: { domain: 'chapter', value: 'new' },
};

describe('chapter progress version', () => {
	test('keeps progress for different chapter structures independently', () => {
		const oldResult = ensureUserChapterState(
			[],
			'player-a',
			master,
			oldProvenance,
		);
		oldResult.chapter.currentPoint = 100;
		const newResult = ensureUserChapterState(
			oldResult.chapters,
			'player-a',
			master,
			newProvenance,
		);
		newResult.chapter.currentPoint = 200;

		expect(newResult.chapters).toHaveLength(2);
		expect(
			ensureUserChapterState(
				newResult.chapters,
				'player-a',
				master,
				oldProvenance,
			).chapter.currentPoint,
		).toBe(100);
	});

	test('clones legacy values as a baseline without mutating legacy', () => {
		const legacy = {
			playerId: 'player-a',
			chapterId: 1,
			currentPoint: 50,
			categoryPoints: [{ categoryId: 10, currentPoint: 50 }],
			missionProgresses: [],
			claimedPointRewardIds: [100],
		};
		const result = ensureUserChapterState(
			[legacy],
			'player-a',
			master,
			newProvenance,
		);

		expect(result.chapters).toHaveLength(2);
		expect(result.chapter).toMatchObject({
			...newProvenance,
			currentPoint: 50,
			claimedPointRewardIds: [100],
		});
		expect(legacy).not.toHaveProperty('identityFingerprint');
	});

	test('identity contains structure only, so balance inputs have no place in it', () => {
		const source = {
			chapter: [1, 2] as const,
			categories: [{ id: 10, category_id: 20 }],
			missions: [
				{
					id: 30,
					chapter_mission_categorys_id: 10,
					mission_condition_type: 1,
					mission_condition_detail: 5,
					transition_contents_id: 6,
					mission_group: 2,
				},
			],
			rewards: [{ id: 40, chapter_id: 1 }],
			rewardDetails: [
				{
					id: 50,
					chapter_point_rewards_id: 40,
					reward_type: 2,
					reward_item_id: 60,
				},
			],
		};

		expect(createChapterIdentityFingerprint(source)).toEqual(
			createChapterIdentityFingerprint(structuredClone(source)),
		);
	});
});
