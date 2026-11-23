import { Database } from 'bun:sqlite';
import { expect, test } from 'bun:test';
import { getMusicIdentityFingerprint } from '../../src/master-data/entity-identity-fingerprints.ts';
import {
	getGrandPrixQuestSeriesRows,
	getGrandPrixQuestStageRows,
	getGrandPrixRewardDataRows,
	getRhythmGameGrandPrixSeriesRows,
} from '../../src/master-data/grand-prix-master-queries.ts';
import { findMusicSource } from '../../src/master-data/music-source.ts';

function fixture() {
	const database = new Database(':memory:');
	database.exec(`
 CREATE TABLE master_grand_prix_quest_series(id INTEGER, grand_prixes_id INTEGER, order_id INTEGER);
 CREATE TABLE master_grand_prix_quest_stages(id INTEGER, grand_prix_series_id INTEGER, order_id INTEGER);
 CREATE TABLE master_grand_prix_rhythm_game_series(id INTEGER, grand_prixes_id INTEGER, order_id INTEGER, quest_musics_type INTEGER, quest_musics_detail INTEGER);
 CREATE TABLE master_grand_prix_reward_datas(id INTEGER, grand_prix_rewards_id INTEGER, reward_type INTEGER, reward_item_id INTEGER, reward_num INTEGER);
 CREATE TABLE master_musics(id INTEGER, sound_id INTEGER);
 INSERT INTO master_grand_prix_quest_series VALUES(1,42,2),(2,42,1),(3,43,1);
 INSERT INTO master_grand_prix_quest_stages VALUES(21,2,2),(22,2,1),(23,3,1);
 INSERT INTO master_grand_prix_rhythm_game_series VALUES(5,42,2,2,7),(6,42,1,2,8),(9,43,1,2,9);
 INSERT INTO master_grand_prix_reward_datas VALUES(102,11,2,202,4),(101,11,1,201,3),(103,12,1,203,9);
 INSERT INTO master_musics VALUES(7,70);
 `);
	return database;
}

test('学校・リズムゲームのseriesとstageを対象IDと表示順で取得する', () => {
	const database = fixture();
	try {
		expect(
			getGrandPrixQuestSeriesRows(database, 42).map((row) => row.id),
		).toEqual([2, 1]);
		expect(
			getGrandPrixQuestStageRows(database, 2).map((row) => row.id),
		).toEqual([22, 21]);
		expect(getRhythmGameGrandPrixSeriesRows(database, 42)).toEqual([
			{
				id: 6,
				grand_prixes_id: 42,
				order_id: 1,
				quest_musics_type: 2,
				quest_musics_detail: 8,
			},
			{
				id: 5,
				grand_prixes_id: 42,
				order_id: 2,
				quest_musics_type: 2,
				quest_musics_detail: 7,
			},
		]);
		expect(getGrandPrixQuestStageRows(database, 99)).toEqual([]);
	} finally {
		database.close();
	}
});
test('報酬の対象・型・数量とID順を維持する', () => {
	const database = fixture();
	try {
		expect(getGrandPrixRewardDataRows(database, 11)).toEqual([
			{ id: 101, reward_type: 1, reward_item_id: 201, reward_num: 3 },
			{ id: 102, reward_type: 2, reward_item_id: 202, reward_num: 4 },
		]);
	} finally {
		database.close();
	}
});
test('楽曲取得とidentityで同じsourceを使い、未登録はnullとする', () => {
	const database = fixture();
	try {
		expect(findMusicSource(database, 7)).toEqual({ id: 7, sound_id: 70 });
		expect(findMusicSource(database, 8)).toBeNull();
		expect(getMusicIdentityFingerprint(database, 7)).toEqual({
			domain: 'music',
			value: '[7,70]',
		});
		expect(getMusicIdentityFingerprint(database, 8)).toBeUndefined();
	} finally {
		database.close();
	}
});
