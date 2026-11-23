import { join, resolve } from 'node:path';
import { parseSingleByteRange } from '@altair/runtime/domain/http/byteRange.ts';
import { Hono } from 'hono';
import { adminUiAssetHeaders } from './admin-ui-cache-policy.ts';
import { adminUiDocumentHeaders } from './admin-ui-document-policy.ts';
import { registerAdminUiPageRoutes } from './admin-ui-page-routes.ts';

export function createAdminUiRoutes(
	distributionRoot = resolve(import.meta.dir, '../dist'),
	extensionPaths: readonly string[] = [],
): Hono {
	const app = new Hono();
	registerAdminUiPageRoutes(
		app,
		() =>
			new Response(Bun.file(join(distributionRoot, 'index.html')), {
				headers: adminUiDocumentHeaders,
			}),
		extensionPaths,
	);
	app.get('/ui/*', async (c) => {
		const assetPath = c.req.path.slice('/admin/ui/'.length);
		if (assetPath.includes('..') || assetPath.length === 0) {
			return c.text('invalid admin asset path', 400);
		}
		const file = Bun.file(join(distributionRoot, assetPath));
		if (!(await file.exists())) {
			return c.text('admin asset not found', 404);
		}
		const fingerprint = /\.([0-9a-f]{64})\.[^/]+$/u.exec(assetPath)?.[1];
		if (fingerprint === undefined) {
			return new Response(file, {
				headers: adminUiAssetHeaders(assetPath),
			});
		}
		const etag = `"${fingerprint}"`;
		const rangeHeader = c.req.header('range');
		if (
			rangeHeader !== undefined &&
			(c.req.header('if-range') === undefined ||
				c.req.header('if-range') === etag)
		) {
			const range = parseSingleByteRange(rangeHeader, file.size);
			if (range.kind === 'unsatisfiable') {
				return new Response(null, {
					status: 416,
					headers: { 'content-range': `bytes */${String(file.size)}` },
				});
			}
			if (range.kind === 'partial') {
				const { start, endExclusive } = range.range;
				return new Response(file.slice(start, endExclusive), {
					status: 206,
					headers: {
						...adminUiAssetHeaders(assetPath),
						'accept-ranges': 'bytes',
						'content-length': String(endExclusive - start),
						'content-range': `bytes ${String(start)}-${String(endExclusive - 1)}/${String(file.size)}`,
						etag,
					},
				});
			}
		}
		return new Response(file, {
			headers: {
				...adminUiAssetHeaders(assetPath),
				'accept-ranges': 'bytes',
				etag,
			},
		});
	});

	return app;
}
