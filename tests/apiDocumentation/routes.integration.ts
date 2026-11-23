import { expect, test } from 'bun:test';
import { z } from 'zod';
import { createApp } from '../../src/server.ts';
import { createNoopServerStateStore } from '../../src/server-state-store-port.ts';
import { config } from '../test-app.ts';

test('本体APIのOpenAPIは登録されたゲームルートを返し、管理APIと文書自身を含めない', async () => {
	const app = createApp({
		...config,
		stateStore: createNoopServerStateStore(),
	});
	const response = await app.request('/v1/openapi.json');
	expect(response.status).toBe(200);
	const document: unknown = await response.json();
	expect(document).toMatchObject({
		openapi: '3.1.0',
		info: { title: 'altair' },
		paths: {
			'/v1/register/set_new_user': {
				post: { responses: { '200': { description: 'OK' } } },
			},
			'/v1/archive/withlive_info': { get: {}, post: {} },
		},
	});
	const { paths } = z
		.object({ paths: z.record(z.string(), z.unknown()) })
		.parse(document);
	expect(paths).not.toHaveProperty('/admin');
	expect(paths).not.toHaveProperty('/health');
	expect(paths).not.toHaveProperty('/v1/docs/');
	expect(paths).not.toHaveProperty('/v1/openapi.json');
});

test('Swagger UIの文書と配信資材を同じAPIから提供する', async () => {
	const app = createApp({
		...config,
		stateStore: createNoopServerStateStore(),
	});
	const redirect = await app.request('/v1/docs');
	expect(redirect.status).toBe(302);
	expect(redirect.headers.get('Location')).toBe('/v1/docs/');
	for (const [path, type] of [
		['/v1/docs/', 'text/html'],
		['/v1/docs/swagger-ui.css', 'text/css'],
		['/v1/docs/swagger-ui-bundle.js', 'javascript'],
		['/v1/docs/initialize.js', 'javascript'],
	]) {
		if (path === undefined || type === undefined)
			throw new Error('配信資材のfixtureが不正です。');
		const response = await app.request(path);
		expect(response.status).toBe(200);
		expect(response.headers.get('Content-Type')).toContain(type);
		expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
		expect(response.headers.get('Referrer-Policy')).toBe('no-referrer');
		const policy = response.headers.get('Content-Security-Policy') ?? '';
		expect(policy).toContain("connect-src 'self'");
		expect(policy).toContain("frame-ancestors 'none'");
	}
	expect((await app.request('/v1/docs/package.json')).status).toBe(404);
});
