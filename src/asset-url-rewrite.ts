import type { Context, MiddlewareHandler } from 'hono';

const officialAssetBaseUrl = 'https://assets.link-like-lovelive.app';

const rewrittenContexts = new WeakSet<Context>();

export function rewriteOfficialAssetUrls(
	value: string,
	assetBaseUrl: string,
): string {
	return replaceOfficialAssetUrls(value, normalizeAssetBaseUrl(assetBaseUrl));
}

export function resolveOfficialAssetUrl(value: string): string {
	const source = new URL(value, `${officialAssetBaseUrl}/`);
	return new URL(`${source.pathname}${source.search}`, officialAssetBaseUrl)
		.href;
}

export function wasAssetUrlRewriteApplied(c: Context): boolean {
	return rewrittenContexts.has(c);
}

export function createAssetUrlRewriteMiddleware(
	assetBaseUrl: string | undefined,
): MiddlewareHandler {
	const normalizedAssetBaseUrl =
		assetBaseUrl === undefined
			? undefined
			: normalizeAssetBaseUrl(assetBaseUrl);
	return async (c, next) => {
		await next();
		if (!normalizedAssetBaseUrl || !isJsonResponse(c)) {
			return;
		}
		const body = await c.res.clone().text();
		if (!body.includes(officialAssetBaseUrl)) {
			return;
		}
		const rewrittenResponse = new Response(
			replaceOfficialAssetUrls(body, normalizedAssetBaseUrl),
			{
				status: c.res.status,
				statusText: c.res.statusText,
				headers: c.res.headers,
			},
		);
		rewrittenContexts.add(c);
		c.res = rewrittenResponse;
	};
}

function normalizeAssetBaseUrl(assetBaseUrl: string): string {
	return assetBaseUrl.replace(/\/+$/, '');
}

function replaceOfficialAssetUrls(
	value: string,
	normalizedAssetBaseUrl: string,
): string {
	return value.replaceAll(officialAssetBaseUrl, normalizedAssetBaseUrl);
}

function isJsonResponse(c: Context): boolean {
	const contentType = c.res.headers.get('content-type');
	return contentType?.includes('application/json') ?? false;
}
