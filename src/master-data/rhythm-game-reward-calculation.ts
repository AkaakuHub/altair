import type { MusicDropRewardDetail } from './rhythm-game-reward-data.ts';
export type RhythmGameReward = {
	rewardType: number;
	rewardItemId: number;
	rewardNum: number;
};

export function calculateMusicMasteryExperience(input: {
	gainMusicExp: number;
	magnification: number;
	staminaCostPerMagnification: number;
	campaignMultiplier: number;
}): number {
	return (
		input.gainMusicExp *
		input.staminaCostPerMagnification *
		input.magnification *
		input.campaignMultiplier
	);
}
export function rollByOdds(
	odds: number,
	total: number,
	random: () => number,
): boolean {
	return Math.floor(random() * total) < odds;
}
export function rollMusicDropRewardDetail(
	details: readonly MusicDropRewardDetail[],
	random: () => number,
): MusicDropRewardDetail | undefined {
	const total = details.reduce((sum, detail) => sum + detail.odds, 0);
	if (total <= 0) return undefined;
	let value = Math.floor(random() * total);
	for (const detail of details) {
		value -= detail.odds;
		if (value < 0) return detail;
	}
	return undefined;
}
export function multiplyReward(
	reward: MusicDropRewardDetail,
	multiplier: number,
): RhythmGameReward {
	return {
		rewardType: reward.rewardType,
		rewardItemId: reward.rewardItemId,
		rewardNum: reward.rewardNum * multiplier,
	};
}
export function mergeRewards(
	rewards: readonly RhythmGameReward[],
): RhythmGameReward[] {
	const merged = new Map<string, RhythmGameReward>();
	for (const reward of rewards) {
		const key = `${reward.rewardType}:${reward.rewardItemId}`;
		const current = merged.get(key);
		if (current) current.rewardNum += reward.rewardNum;
		else merged.set(key, { ...reward });
	}
	return [...merged.values()];
}
