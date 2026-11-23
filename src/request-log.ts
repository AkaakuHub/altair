import type { MiddlewareHandler } from 'hono';
import { wasAssetUrlRewriteApplied } from './asset-url-rewrite.ts';
import {
	headersToRecord,
	readRequestBodySnapshot,
	readResponseBodySnapshot,
} from './request-log-snapshot.ts';
import { createSqliteRequestLogStore } from './request-log-store.ts';

type RequestLogOptions = {
	sqlitePath: string;
};

export { headersToRecord } from './request-log-snapshot.ts';

export function createRequestLogMiddleware(
	options: RequestLogOptions,
): MiddlewareHandler {
	const store = createSqliteRequestLogStore(options.sqlitePath);

	return async (c, next) => {
		const startedAt = new Date();
		const requestBody = await readRequestBodySnapshot(c.req.raw);
		await next();
		const responseBody = await readResponseBodySnapshot(c.res);

		store.write({
			at: startedAt.toISOString(),
			durationMs: Date.now() - startedAt.getTime(),
			method: c.req.method,
			path: new URL(c.req.url).pathname,
			requestBody,
			requestHeaders: headersToRecord(c.req.raw.headers),
			responseBody,
			responseHeaders: headersToRecord(c.res.headers),
			assetRewriteApplied: wasAssetUrlRewriteApplied(c),
			status: c.res.status,
		});
	};
}
