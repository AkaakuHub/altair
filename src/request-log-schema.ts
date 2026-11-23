import type { Database } from 'bun:sqlite';
import { isRecord } from './state/json-state-utils.ts';

export function initializeRequestLogSchema(db: Database): void {
	migrateRequestLogSchema(db);
	db.exec(`
		CREATE TABLE IF NOT EXISTS api_request_logs (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			at TEXT NOT NULL,
			method TEXT NOT NULL,
			path TEXT NOT NULL,
			status INTEGER NOT NULL,
			duration_ms INTEGER NOT NULL,
			request_headers_json TEXT NOT NULL,
			request_body TEXT,
			request_body_type TEXT NOT NULL,
			request_body_bytes INTEGER NOT NULL,
			response_headers_json TEXT NOT NULL,
			response_body TEXT,
			response_body_type TEXT NOT NULL,
			response_body_bytes INTEGER NOT NULL,
			asset_rewrite_applied INTEGER NOT NULL DEFAULT 0
		);
		CREATE INDEX IF NOT EXISTS idx_api_request_logs_path_id
			ON api_request_logs(path, id);
		CREATE INDEX IF NOT EXISTS idx_api_request_logs_status_id
			ON api_request_logs(status, id);
		CREATE INDEX IF NOT EXISTS idx_api_request_logs_at
			ON api_request_logs(at);
	`);
}

function migrateRequestLogSchema(db: Database): void {
	if (!hasTable(db, 'api_request_logs')) {
		return;
	}
	const columns = tableColumns(db, 'api_request_logs');
	if (
		columns.has('request_body_truncated') ||
		columns.has('response_body_truncated')
	) {
		db.exec(`
			ALTER TABLE api_request_logs RENAME TO api_request_logs_old;
			CREATE TABLE api_request_logs (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				at TEXT NOT NULL,
				method TEXT NOT NULL,
				path TEXT NOT NULL,
				status INTEGER NOT NULL,
				duration_ms INTEGER NOT NULL,
				request_headers_json TEXT NOT NULL,
				request_body TEXT,
				request_body_type TEXT NOT NULL,
				request_body_bytes INTEGER NOT NULL,
				response_headers_json TEXT NOT NULL,
				response_body TEXT,
				response_body_type TEXT NOT NULL,
				response_body_bytes INTEGER NOT NULL,
				asset_rewrite_applied INTEGER NOT NULL DEFAULT 0
			);
			INSERT INTO api_request_logs (
				id,
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
			)
			SELECT
				id,
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
				0
			FROM api_request_logs_old;
			DROP TABLE api_request_logs_old;
		`);
		return;
	}
	if (!columns.has('asset_rewrite_applied')) {
		db.exec(
			'ALTER TABLE api_request_logs ADD COLUMN asset_rewrite_applied INTEGER NOT NULL DEFAULT 0',
		);
	}
}

function hasTable(db: Database, tableName: string): boolean {
	const row = db
		.query(
			"SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1",
		)
		.get(tableName);
	return row !== null;
}

function tableColumns(db: Database, tableName: string): Set<string> {
	const rows = db.query(`PRAGMA table_info(${tableName})`).all();
	return new Set(
		rows
			.map((row) => (isRecord(row) ? row.name : undefined))
			.filter((name): name is string => typeof name === 'string'),
	);
}
