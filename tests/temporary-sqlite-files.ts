import { Database } from 'bun:sqlite';
import { randomUUID } from 'node:crypto';
import { mkdirSync, unlinkSync } from 'node:fs';

type InitializeDatabase = (database: Database) => void;

export class TemporarySqliteFiles {
	private readonly paths = new Set<string>();

	create(prefix: string, initialize: InitializeDatabase): string {
		mkdirSync('logs', { recursive: true });
		const path = `logs/${prefix}-${process.pid}-${randomUUID()}.sqlite`;
		const database = new Database(path);
		this.paths.add(path);
		try {
			initialize(database);
		} finally {
			database.close();
		}
		return path;
	}

	cleanup(): void {
		const errors: unknown[] = [];
		for (const path of this.paths) {
			try {
				unlinkSync(path);
			} catch (error) {
				errors.push(error);
			} finally {
				this.paths.delete(path);
			}
		}
		if (errors.length > 0) {
			throw new AggregateError(
				errors,
				'一時SQLiteファイルを削除できませんでした',
			);
		}
	}
}
