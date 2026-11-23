import { Database } from 'bun:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { initializeRequestLogSchema } from './request-log-schema.ts';
import type { RequestLogStore } from './request-log-types.ts';

export function createSqliteRequestLogStore(dbPath: string): RequestLogStore {
	mkdirSync(dirname(dbPath), { recursive: true });
	const db = new Database(dbPath);
	db.exec('PRAGMA journal_mode = WAL');
	initializeRequestLogSchema(db);
	const insert = db.query(`
		INSERT INTO api_request_logs (
			at,
			method,
			path,
			status,
			duration_ms,
			request_headers_json,
			request_body,
			request_body_type,
			request_body_bytes,
			response_headers_json,
			response_body,
			response_body_type,
			response_body_bytes,
			asset_rewrite_applied
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`);
	return {
		write: (event) => {
			insert.run(
				event.at,
				event.method,
				event.path,
				event.status,
				event.durationMs,
				JSON.stringify(event.requestHeaders),
				event.requestBody.body,
				event.requestBody.bodyType,
				event.requestBody.bodyBytes,
				JSON.stringify(event.responseHeaders),
				event.responseBody.body,
				event.responseBody.bodyType,
				event.responseBody.bodyBytes,
				event.assetRewriteApplied ? 1 : 0,
			);
		},
	};
}
