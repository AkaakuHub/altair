import { Database } from 'bun:sqlite';
import { afterEach, describe, expect, test } from 'bun:test';
import {
	calculateRhythmGameMusicMasteryExperience,
	createRhythmGameDropRewards,
	getActiveRhythmGameCampaignTypes,
	getRhythmGameMusicMasteryLevel,
} from '../src/master-data/rhythm-game-rewards.ts';

describe('rhythm game rewards', () => {
	let database: Database | undefined;

	afterEach(() => database?.close());

	test('calculates rewards, experience, campaigns, and levels from the supplied database', () => {
		database = createRhythmRewardDatabase();
		const now = '2026-01-01T00:00:00.000Z';

		expect(
			calculateRhythmGameMusicMasteryExperience({
				database,
				musicId: 1,
				difficulty: 3,
				magnification: 2,
				now,
			}),
		).toBe(280);
		expect(getRhythmGameMusicMasteryLevel(database, 280)).toBe(42);
		expect(getActiveRhythmGameCampaignTypes(database, now)).toEqual([3, 5, 6]);
		expect(
			createRhythmGameDropRewards({
				database,
				musicId: 1,
				difficulty: 3,
				magnification: 2,
				now,
				random: () => 0,
			}),
		).toEqual([
			{ rewardType: 1, rewardItemId: 3001001, rewardNum: 120 },
			{ rewardType: 3, rewardItemId: 3004000, rewardNum: 6000 },
		]);
	});

	test('uses the supplied random source for drop and detail selection', () => {
		database = createRhythmRewardDatabase();
		const randomValues = [0, 0.75];

		const rewards = createRhythmGameDropRewards({
			database,
			musicId: 1,
			difficulty: 3,
			magnification: 1,
			now: '2026-01-01T00:00:00.000Z',
			random: () => randomValues.shift() ?? 0,
		});

		expect(rewards[0]).toEqual({
			rewardType: 1,
			rewardItemId: 3001002,
			rewardNum: 90,
		});
	});
});

function createRhythmRewardDatabase(): Database {
	const database = new Database(':memory:');
	database.exec(`
		CREATE TABLE master_music_scores (
			id INTEGER,
			expert_level INTEGER,
			expert_max_combo INTEGER,
			expert_drop_reward_series_id INTEGER,
			expert_gain_music_exp INTEGER
		);
		CREATE TABLE master_music_drop_rewards (
			id INTEGER,
			drop_reward_series_id INTEGER,
			music_drop_reward_odds INTEGER
		);
		CREATE TABLE master_music_drop_reward_details (
			id INTEGER,
			music_drop_rewards_id INTEGER,
			reward_type INTEGER,
			reward_item_id INTEGER,
			reward_num INTEGER,
			odds INTEGER
		);
		CREATE TABLE master_campaign (
			id INTEGER,
			campaign_type INTEGER,
			target_contents INTEGER,
			effect_value INTEGER,
			start_time TEXT,
			end_time TEXT
		);
		CREATE TABLE master_music_levels (
			experience_type INTEGER,
			level INTEGER,
			experience INTEGER,
			cumulative_experience INTEGER
		);
		INSERT INTO master_music_scores VALUES (1, 1, 100, 10, 7);
		INSERT INTO master_music_drop_rewards VALUES (11, 10, 10000);
		INSERT INTO master_music_drop_reward_details VALUES
			(1, 11, 1, 3001001, 2, 1),
			(2, 11, 1, 3001002, 3, 1);
		INSERT INTO master_campaign VALUES
			(1, 3, 800, 300, '2025-01-01', '2027-01-01'),
			(2, 5, 800, 300, '2025-01-01', '2027-01-01'),
			(3, 6, 800, 200, '2025-01-01', '2027-01-01');
		INSERT INTO master_music_levels VALUES (1, 42, 1, 1);
	`);
	return database;
}
