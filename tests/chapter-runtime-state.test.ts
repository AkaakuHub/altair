import { describe, expect, test } from 'bun:test';
import { createDefaultChapterRuntimeState } from '../src/chapter-runtime-state.ts';
import { isRecord } from '../src/state/json-state-utils.ts';
import { applyRawServerStateMigrations } from '../src/state-migrations/raw-server-state-migrations.ts';

describe('chapter runtime state', () => {
	test('raw state migration fills required chapter runtime state', () => {
		const chapterDefaults = {
			chapterId: 10003,
			chapterName: 'chapter',
			startDate: '2026-06-30T03:00:00Z',
			endDate: '2026-07-01T03:00:00Z',
		};
		const expectedRuntime = createDefaultChapterRuntimeState(chapterDefaults);
		const migrated = applyRawServerStateMigrations(
			{
				userActivityRecords: [],
			},
			expectedRuntime,
		);

		expect(isRecord(migrated)).toBe(true);
		if (!isRecord(migrated)) {
			throw new Error('migrated state is not an object');
		}
		expect(migrated.chapter).toEqual(expectedRuntime);
	});

	test('raw state migration removes chapter master copies and preserves progress', () => {
		const migrated = applyRawServerStateMigrations({
			userChapters: [
				{
					playerId: 'player-1',
					chapterId: 10003,
					currentPoint: 1800,
					currentRank: 2,
					isMaxRank: false,
					categoryPoints: [
						{
							categoryId: 0,
							currentPoint: 0,
							maxPoint: 8600,
							isCapped: false,
						},
						{
							categoryId: 1,
							currentPoint: 1800,
							maxPoint: 8600,
							isCapped: false,
						},
					],
					missionProgresses: [
						{
							missionId: 3403,
							achievedNum: 1,
							isAchieved: true,
							isReceived: true,
						},
					],
					claimedPointRewardIds: [10003001],
				},
			],
		});

		expect(migrated).toMatchObject({
			userChapters: [
				{
					playerId: 'player-1',
					chapterId: 10003,
					currentPoint: 1800,
					categoryPoints: [{ categoryId: 1, currentPoint: 1800 }],
					missionProgresses: [{ missionId: 3403, achievedNum: 1 }],
					claimedPointRewardIds: [10003001],
				},
			],
		});
		const chapter = isRecord(migrated)
			? (migrated.userChapters as Array<Record<string, unknown>>)[0]
			: undefined;
		const category = Array.isArray(chapter?.categoryPoints)
			? chapter.categoryPoints[0]
			: undefined;
		expect(chapter).not.toHaveProperty('currentRank');
		expect(chapter).not.toHaveProperty('isMaxRank');
		expect(chapter?.categoryPoints).toHaveLength(1);
		expect(category).not.toHaveProperty('maxPoint');
		expect(category).not.toHaveProperty('isCapped');
	});
});
