import { describe, expect, test } from 'bun:test';
import { getCampaignMultiplier } from '../src/master-data/rhythm-game-campaigns.ts';
import {
	calculateMusicMasteryExperience,
	mergeRewards,
	multiplyReward,
	rollByOdds,
	rollMusicDropRewardDetail,
} from '../src/master-data/rhythm-game-reward-calculation.ts';

describe('rhythm game reward calculation', () => {
	test('applies all music experience multipliers', () =>
		expect(
			calculateMusicMasteryExperience({
				gainMusicExp: 7,
				magnification: 2,
				staminaCostPerMagnification: 10,
				campaignMultiplier: 2,
			}),
		).toBe(280));
	test('resolves campaign multiplier', () => {
		const campaigns = [{ campaignType: 3, effectValue: 250 }];
		expect(getCampaignMultiplier(campaigns, 3)).toBe(2.5);
		expect(getCampaignMultiplier(campaigns, 6)).toBe(1);
	});
	test('uses integer odds boundaries and weighted order', () => {
		expect(rollByOdds(5000, 10000, () => 0.49999)).toBe(true);
		expect(rollByOdds(5000, 10000, () => 0.5)).toBe(false);
		const details = [
			{ rewardType: 1, rewardItemId: 10, rewardNum: 2, odds: 1 },
			{ rewardType: 1, rewardItemId: 20, rewardNum: 3, odds: 3 },
		];
		expect(rollMusicDropRewardDetail(details, () => 0)?.rewardItemId).toBe(10);
		expect(rollMusicDropRewardDetail(details, () => 0.25)?.rewardItemId).toBe(
			20,
		);
		expect(rollMusicDropRewardDetail([], () => 0)).toBeUndefined();
	});
	test('multiplies and merges by type and item in first order', () => {
		const reward = multiplyReward(
			{ rewardType: 1, rewardItemId: 10, rewardNum: 2, odds: 1 },
			30,
		);
		expect(
			mergeRewards([
				reward,
				{ rewardType: 3, rewardItemId: 10, rewardNum: 5 },
				{ rewardType: 1, rewardItemId: 10, rewardNum: 7 },
			]),
		).toEqual([
			{ rewardType: 1, rewardItemId: 10, rewardNum: 67 },
			{ rewardType: 3, rewardItemId: 10, rewardNum: 5 },
		]);
	});
});
