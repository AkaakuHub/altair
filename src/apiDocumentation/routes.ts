import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Hono, MiddlewareHandler } from 'hono';
import { createGameOpenApiDocument } from './document.ts';

const secureDocumentation: MiddlewareHandler = async (context, next) => {
	await next();
	context.header(
		'Content-Security-Policy',
		"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
	);
	context.header('X-Content-Type-Options', 'nosniff');
	context.header('Referrer-Policy', 'no-referrer');
};

export function registerGameApiDocumentation(app: Hono): void {
	app.use('/v1/docs', secureDocumentation);
	app.use('/v1/docs/*', secureDocumentation);
	app.use('/v1/openapi.json', secureDocumentation);
	const distribution = dirname(
		fileURLToPath(import.meta.resolve('swagger-ui-dist/package.json')),
	);
	app.get('/v1/openapi.json', (c) => {
		c.header('Cache-Control', 'no-store');
		return c.json(createGameOpenApiDocument(app.routes));
	});
	app.get('/v1/docs', (c) => c.redirect('/v1/docs/', 302));
	app.get(
		'/v1/docs/',
		() =>
			new Response(Bun.file(new URL('./ui/index.html', import.meta.url)), {
				headers: { 'Cache-Control': 'no-cache' },
			}),
	);
	app.get(
		'/v1/docs/initialize.js',
		() =>
			new Response(Bun.file(new URL('./ui/initialize.js', import.meta.url)), {
				headers: { 'Cache-Control': 'no-cache' },
			}),
	);
	for (const asset of ['swagger-ui.css', 'swagger-ui-bundle.js']) {
		app.get(
			`/v1/docs/${asset}`,
			() =>
				new Response(Bun.file(join(distribution, asset)), {
					headers: { 'Cache-Control': 'no-cache' },
				}),
		);
	}
}
