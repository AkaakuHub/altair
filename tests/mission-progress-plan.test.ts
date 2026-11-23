import { describe, expect, test } from 'bun:test';
import { createMissionProgressPlan } from '../src/application/mission-progress-plan.ts';

describe('mission progress plan', () => {
	test('maps a standard quest clear to common and beginner mission progress', () => {
		expect(
			createMissionProgressPlan({
				type: 'questClear',
				playerId: 'player',
				questLiveType: 1,
				isSkip: false,
				gameDate: '2026-06-21',
			}),
		).toEqual({
			playerId: 'player',
			commonTransitionId: 100,
			beginnerTransitionId: 101,
			dailyMissionGameDate: '2026-06-21',
			schoolStageStarTotal: undefined,
		});
	});

	test('does not advance beginner missions when a quest is skipped', () => {
		expect(
			createMissionProgressPlan({
				type: 'questClear',
				playerId: 'player',
				questLiveType: 1,
				isSkip: true,
				gameDate: '2026-06-21',
			}),
		).toEqual({
			playerId: 'player',
			commonTransitionId: 100,
			beginnerTransitionId: undefined,
			dailyMissionGameDate: '2026-06-21',
			schoolStageStarTotal: undefined,
		});
	});

	test('maps settings and rhythm game operations independently', () => {
		expect(
			createMissionProgressPlan({
				type: 'homeWallpaperSetting',
				playerId: 'player',
			}),
		).toEqual({ playerId: 'player', beginnerTransitionId: 301 });
		expect(
			createMissionProgressPlan({
				type: 'profileCardSetting',
				playerId: 'player',
			}),
		).toEqual({ playerId: 'player', beginnerTransitionId: 305 });
		expect(
			createMissionProgressPlan({
				type: 'rhythmGameClear',
				playerId: 'player',
			}),
		).toEqual({
			playerId: 'player',
			commonTransitionId: 800,
			rhythmGameStarTotal: undefined,
		});
	});
});
