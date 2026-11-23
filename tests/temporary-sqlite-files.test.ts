import type { Database } from 'bun:sqlite';
import { afterEach, describe, expect, test } from 'bun:test';
import { existsSync } from 'node:fs';
import { TemporarySqliteFiles } from './temporary-sqlite-files.ts';

const temporarySqliteFiles = new TemporarySqliteFiles();

afterEach(() => {
	temporarySqliteFiles.cleanup();
});

describe('TemporarySqliteFiles', () => {
	test('初期化用Databaseを閉じてcleanup時にファイルを削除する', () => {
		let initializedDatabase: Database | undefined;
		const path = temporarySqliteFiles.create(
			'temporary-sqlite-files-test',
			(database) => {
				initializedDatabase = database;
				database.exec('CREATE TABLE example (id INTEGER PRIMARY KEY)');
			},
		);

		expect(existsSync(path)).toBe(true);
		expectDatabaseClosed(initializedDatabase);

		temporarySqliteFiles.cleanup();
		expect(existsSync(path)).toBe(false);
	});
});

function expectDatabaseClosed(database: Database | undefined): void {
	if (!database) {
		throw new Error('Databaseが初期化されませんでした');
	}
	expect(() => database.exec('SELECT * FROM example')).toThrow();
}
