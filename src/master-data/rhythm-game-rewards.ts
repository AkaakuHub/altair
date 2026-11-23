import type { Database } from 'bun:sqlite';
import { musicLevelForEarnedExperienceFromDatabase } from './music-levels.ts';
import {
	getActiveRhythmGameCampaigns,
	getCampaignMultiplier,
} from './rhythm-game-campaigns.ts';
import {
	calculateMusicMasteryExperience,
	mergeRewards,
	multiplyReward,
	type RhythmGameReward,
	rollByOdds,
	rollMusicDropRewardDetail,
} from './rhythm-game-reward-calculation.ts';
import {
	getMusicDropRewardDetails,
	getMusicDropRewardRows,
	getMusicScoreDifficultyMetadata,
} from './rhythm-game-reward-data.ts';

const itemDropMultiplyCampaignType = 3,
	stylePointCampaignType = 5,
	musicMasteryCampaignType = 6;
const stylePointItemId = 3004000,
	stylePointRewardType = 3,
	baseStylePointPerMagnification = 1000,
	staminaCostPerMagnification = 10;

export function getRhythmGameStaminaCost(magnification: number): number {
	return staminaCostPerMagnification * magnification;
}
export function calculateRhythmGameMusicMasteryExperience(input: {
	database: Database;
	musicId: number;
	difficulty: number;
	magnification: number;
	now: string;
}): number {
	const series = requireSeries(input.database, input.musicId, input.difficulty);
	const campaigns = getActiveRhythmGameCampaigns(input.database, input.now);
	return calculateMusicMasteryExperience({
		gainMusicExp: series.gainMusicExp,
		magnification: input.magnification,
		staminaCostPerMagnification,
		campaignMultiplier: getCampaignMultiplier(
			campaigns,
			musicMasteryCampaignType,
		),
	});
}
export function getRhythmGameMusicMasteryLevel(
	database: Database,
	earnedMusicExp: number,
): number {
	return musicLevelForEarnedExperienceFromDatabase(database, earnedMusicExp);
}
export function createRhythmGameDropRewards(input: {
	database: Database;
	musicId: number;
	difficulty: number;
	magnification: number;
	now: string;
	random: () => number;
}): RhythmGameReward[] {
	const series = requireSeries(input.database, input.musicId, input.difficulty);
	const campaigns = getActiveRhythmGameCampaigns(input.database, input.now);
	const itemMultiplier =
		input.magnification *
		staminaCostPerMagnification *
		getCampaignMultiplier(campaigns, itemDropMultiplyCampaignType);
	const styleMultiplier =
		input.magnification *
		getCampaignMultiplier(campaigns, stylePointCampaignType);
	const rewards: RhythmGameReward[] = [];
	for (const row of getMusicDropRewardRows(
		input.database,
		series.dropRewardSeriesId,
	)) {
		if (!rollByOdds(row.musicDropRewardOdds, 10000, input.random)) continue;
		const detail = rollMusicDropRewardDetail(
			getMusicDropRewardDetails(input.database, row.id),
			input.random,
		);
		if (detail) rewards.push(multiplyReward(detail, itemMultiplier));
	}
	rewards.push({
		rewardType: stylePointRewardType,
		rewardItemId: stylePointItemId,
		rewardNum: baseStylePointPerMagnification * styleMultiplier,
	});
	return mergeRewards(rewards);
}
export function getActiveRhythmGameCampaignTypes(
	database: Database,
	now: string,
): number[] {
	return getActiveRhythmGameCampaigns(database, now).map(
		(campaign) => campaign.campaignType,
	);
}
function requireSeries(
	database: Database,
	musicId: number,
	difficulty: number,
) {
	const series = getMusicScoreDifficultyMetadata(database, musicId, difficulty);
	if (!series)
		throw new Error(
			`rhythm game music score not found: ${musicId}/${difficulty}`,
		);
	return series;
}
