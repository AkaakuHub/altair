import { Database } from 'bun:sqlite';
import { describe, expect, test } from 'bun:test';
import type { RegisteredUserState } from '../src/server-state-schema.ts';
import { createArchiveRankingResponse } from '../src/v1/responses/archive-ranking-response.ts';

describe('archive ranking response', () => {
	test('master期間と報酬にlocal user gift pointを投影する', () => {
		const database = createDatabase();
		try {
			const playerA = createUser('player-a', 'A');
			const playerB = createUser('player-b', 'B');
			const state = {
				registeredUsers: [playerA, playerB],
				userProfileDesigns: [
					createProfileDesign('player-a'),
					createProfileDesign('player-b'),
				],
				archiveGiftPoints: [
					createGiftPoint('player-a', 100),
					createGiftPoint('player-b', 200),
				],
			};

			const response = createArchiveRankingResponse(
				database,
				state,
				playerA,
				'current',
				1021,
				'2026-05-01T00:00:00.000Z',
			);

			expect(response.ranking_start_time).toBe('2026-04-02T03:00:00Z');
			expect(response.ranking_end_time).toBe('2026-06-30T18:59:59Z');
			expect(response.cheer_rewards).toEqual([
				{
					cheer_rewards_id: 260410211,
					min_target_num: 1,
					max_target_num: 1,
					reward_datas: [
						{
							cheer_reward_datas_id: 2604102111,
							item_id: 5021041,
							item_type: 10,
							num: 1,
						},
					],
				},
			]);
			expect(
				response.cheer_rankings.map(({ player_id, cheer_point }) => ({
					player_id,
					cheer_point,
				})),
			).toEqual([
				{ player_id: 'player-b', cheer_point: 200 },
				{ player_id: 'player-a', cheer_point: 100 },
			]);
			expect(response.my_rank_status).toBe('ranked');
			expect(response.my_rank).toBe(2);
			expect(response.cheer_point).toBe(100);
		} finally {
			database.close();
		}
	});
});

function createDatabase(): Database {
	const database = new Database(':memory:');
	database.exec(`
		CREATE TABLE master_cheer_members (id INTEGER, characters_id INTEGER);
		CREATE TABLE master_cheer_rankings (
			id INTEGER,
			cheer_members_id INTEGER,
			start_time TEXT,
			end_time TEXT
		);
		CREATE TABLE master_cheer_rewards (
			id INTEGER,
			cheer_rankings_id INTEGER,
			min_target_num INTEGER,
			max_target_num INTEGER
		);
		CREATE TABLE master_cheer_reward_datas (
			id INTEGER,
			cheer_rewards_id INTEGER,
			reward_type INTEGER,
			reward_item_id INTEGER,
			reward_num INTEGER
		);
		CREATE TABLE archive_detail (archives_id TEXT, characters TEXT);
		INSERT INTO master_cheer_members VALUES (1021, 1021);
		INSERT INTO master_cheer_rankings VALUES (
			26041021,
			1021,
			'2026-04-02T03:00:00Z',
			'2026-06-30T18:59:59Z'
		);
		INSERT INTO master_cheer_rewards VALUES (260410211, 26041021, 1, 1);
		INSERT INTO master_cheer_reward_datas VALUES (
			2604102111,
			260410211,
			10,
			5021041,
			1
		);
		INSERT INTO archive_detail VALUES (
			'live-1',
			'[{"character_id":1021}]'
		);
	`);
	return database;
}

function createUser(playerId: string, playerName: string): RegisteredUserState {
	return {
		playerId,
		playerName,
		deviceSpecificId: `${playerId}-device`,
		sessionToken: `${playerId}-session`,
		birthday: '2000-01-01',
		entryTime: '2026-01-01T00:00:00Z',
		lastLoginDate: '2026-01-01T00:00:00Z',
		playerLevel: 1,
	};
}

function createProfileDesign(playerId: string) {
	return {
		playerId,
		cardDesignList: [],
		iconDesignList: [
			{
				d_profile_my_designs_id: `${playerId}-icon`,
				is_setting: true,
				my_design_name: 'icon',
				my_design_parts_info: '{}',
				my_design_type: 2 as const,
			},
		],
	};
}

function createGiftPoint(playerId: string, totalUserGiftPoint: number) {
	return {
		playerId,
		liveId: 'live-1',
		totalUserGiftPoint,
		totalUserGiftPointWithoutArchive: 0,
		awardedArchivePrizeStarCount: 0,
		allocatedArchivePrizeStarCount: 0,
	};
}
