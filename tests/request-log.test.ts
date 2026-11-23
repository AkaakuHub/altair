import { Database } from 'bun:sqlite';
import { describe, expect, test } from 'bun:test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Hono } from 'hono';
import { createAssetUrlRewriteMiddleware } from '../src/asset-url-rewrite.ts';
import {
	createRequestLogMiddleware,
	headersToRecord,
} from '../src/request-log.ts';
import {
	createBodySnapshot,
	readResponseBodySnapshot,
} from '../src/request-log-snapshot.ts';

describe('request log', () => {
	test('serializes response headers by name', () => {
		const headers = new Headers();
		headers.set('launcher_info', '{"quest_live_status":1}');
		headers.set('x-res-version', 'R2606002@test');

		expect(headersToRecord(headers)).toEqual({
			launcher_info: '{"quest_live_status":1}',
			'x-res-version': 'R2606002@test',
		});
	});

	test('records UTF-8 bytes and detects JSON without a content type', () => {
		expect(createBodySnapshot('{"message":"日本語"}', null)).toEqual({
			body: '{"message":"日本語"}',
			bodyBytes: 23,
			bodyType: 'json',
		});
	});

	test('records an empty body as null', () => {
		expect(createBodySnapshot('', 'application/json')).toEqual({
			body: null,
			bodyBytes: 0,
			bodyType: 'null',
		});
	});

	test('chunked binary streamの本文をrequest logへ複製しない', async () => {
		const response = new Response(
			new ReadableStream({
				pull() {
					throw new Error('binary stream body must not be read');
				},
			}),
			{
				headers: {
					'content-type': 'application/vnd.link-like.model-preview-stream',
					'transfer-encoding': 'chunked',
				},
			},
		);

		expect(await readResponseBodySnapshot(response)).toEqual({
			body: null,
			bodyBytes: 0,
			bodyType: 'null',
		});
	});

	test('SSEの本文をrequest logへ複製しない', async () => {
		const response = new Response(
			new ReadableStream({
				pull() {
					throw new Error('SSE body must not be read');
				},
			}),
			{
				headers: { 'content-type': 'text/event-stream; charset=utf-8' },
			},
		);

		expect(await readResponseBodySnapshot(response)).toEqual({
			body: null,
			bodyBytes: 0,
			bodyType: 'null',
		});
	});

	test('固定長binary responseの本文を複製せずbyte数だけ記録する', async () => {
		const response = new Response(
			new ReadableStream({
				pull() {
					throw new Error('binary response body must not be read');
				},
			}),
			{
				headers: {
					'content-length': '89774677',
					'content-type': 'application/octet-stream',
				},
			},
		);

		expect(await readResponseBodySnapshot(response)).toEqual({
			body: null,
			bodyBytes: 89_774_677,
			bodyType: 'binary',
		});
	});

	test('records whether asset URL rewrite was applied', async () => {
		const dbPath = join(
			mkdtempSync(join(tmpdir(), 'request-log-')),
			'log.sqlite',
		);
		const app = new Hono();
		app.use('*', createRequestLogMiddleware({ sqlitePath: dbPath }));
		app.use(
			'*',
			createAssetUrlRewriteMiddleware('https://assets.local.example/'),
		);
		app.get('/asset', (c) =>
			c.json({
				url: 'https://assets.link-like-lovelive.app/test.png',
			}),
		);
		app.get('/plain', (c) => c.json({ ok: true }));

		await app.request('/asset');
		await app.request('/plain');

		const db = new Database(dbPath, { readonly: true });
		try {
			expect(
				db
					.query(
						'select asset_rewrite_applied from api_request_logs where path = ?',
					)
					.get('/asset'),
			).toEqual({ asset_rewrite_applied: 1 });
			expect(
				db
					.query(
						'select asset_rewrite_applied from api_request_logs where path = ?',
					)
					.get('/plain'),
			).toEqual({ asset_rewrite_applied: 0 });
		} finally {
			db.close();
		}
	});
});
