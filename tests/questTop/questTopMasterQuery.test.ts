import { Database } from 'bun:sqlite';
import { afterEach, expect, test } from 'bun:test';
import {
	getActiveRaidEvent,
	getDailyLiveStatus,
	getDreamLiveStatus,
	getMusicLiveStatus,
	getStandardLiveStatus,
} from '../../src/v1/active-master-database/quest-top-master-query.ts';

const databases: Database[] = [];

afterEach(() => {
	for (const database of databases) database.close();
	databases.length = 0;
});

test('quest topで必要な期間masterをすべて参照する', () => {
	const database = new Database(':memory:');
	databases.push(database);
	for (const tableName of [
		'master_daily_quest_series',
		'master_dream_quest_series',
		'master_music_learning_quest_series',
		'master_raid_events',
		'master_standard_quest_areas',
	]) {
		database.exec(
			`CREATE TABLE ${tableName} (id INTEGER, start_time TEXT, end_time TEXT)`,
		);
		database
			.query(
				`INSERT INTO ${tableName} (id, start_time, end_time) VALUES (?, ?, ?)`,
			)
			.run(1, '2026-06-01T00:00:00Z', '2026-07-01T00:00:00Z');
	}

	const now = '2026-06-30T00:00:00Z';
	expect(getDailyLiveStatus(database, now)).toBe(1);
	expect(getDreamLiveStatus(database, now)).toBe(1);
	expect(getMusicLiveStatus(database, now)).toBe(1);
	expect(getStandardLiveStatus(database, now)).toBe(1);
	expect(getActiveRaidEvent(database, now)?.id).toBe(1);
});
