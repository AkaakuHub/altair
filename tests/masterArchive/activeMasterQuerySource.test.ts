import { expect, test } from 'bun:test';
import { join } from 'node:path';
import { collectActiveMasterQueries } from '../../src/master-archive/infrastructure/active-master-query-source.ts';
import {
	mappedSpreadQuery,
	query as resolvedQuery,
} from '../fixtures/activeMasterQuerySource/resolved/src/query.ts';
import { query as unresolvedQuery } from '../fixtures/activeMasterQuerySource/unresolved/src/v1/active-master-database/query.ts';

const fixtures = join(import.meta.dir, '../fixtures/activeMasterQuerySource');

test('配列spreadを含むactive master queryを展開する', async () => {
	const queries = await collectActiveMasterQueries(join(fixtures, 'resolved'));
	const executed: string[] = [];
	const database = {
		query: (sql: string): null => {
			executed.push(sql);
			return null;
		},
	};
	resolvedQuery(database);
	mappedSpreadQuery(database);

	expect(queries.map((query) => query.sql)).toEqual([
		'SELECT id FROM master_grade_add_skills ORDER BY CASE id WHEN 0 THEN 0 END',
		'SELECT id, musics_id FROM master_music_learning_quest_series ORDER BY id',
	]);
	expect(executed).toEqual([
		'SELECT id, musics_id FROM master_music_learning_quest_series ORDER BY id',
		'SELECT id FROM master_grade_add_skills ORDER BY CASE id WHEN 1 THEN 0 END',
	]);
});

test('active master領域の未解決queryを拒否する', async () => {
	expect(
		unresolvedQuery({ query: (sql: string) => sql }, 'master_dynamic'),
	).toBe('SELECT id FROM master_dynamic');
	await expect(
		collectActiveMasterQueries(join(fixtures, 'unresolved')),
	).rejects.toThrow('Unresolved active master query');
});
