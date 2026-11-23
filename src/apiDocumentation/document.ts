import type { ApiOperation, ApiParameter } from './operation.ts';
import {
	describeTypedOperation,
	gameContractSchemas,
} from './typedOperation.ts';

const httpMethods = [
	'get',
	'post',
	'put',
	'patch',
	'delete',
	'head',
	'options',
] as const;
type HttpMethod = (typeof httpMethods)[number];
type Route = Readonly<{ method: string; path: string }>;

function isHttpMethod(method: string): method is HttpMethod {
	return httpMethods.some((candidate) => candidate === method);
}

export function createGameOpenApiDocument(routes: readonly Route[]) {
	const paths: Record<string, Partial<Record<HttpMethod, ApiOperation>>> = {};
	for (const route of routes) {
		const method = route.method.toLowerCase();
		if (
			!isHttpMethod(method) ||
			!route.path.startsWith('/v1/') ||
			route.path === '/v1/openapi.json' ||
			route.path === '/v1/docs' ||
			route.path.startsWith('/v1/docs/')
		)
			continue;
		const parameters: ApiParameter[] = [];
		const path = route.path
			.split('/')
			.map((segment) => {
				if (!segment.startsWith(':')) return segment;
				const name = /^:([A-Za-z_][A-Za-z0-9_]*)(?:\{.*\})?$/u.exec(
					segment,
				)?.[1];
				if (name === undefined)
					throw new Error(`Unsupported OpenAPI path parameter: ${route.path}`);
				if (!parameters.some((parameter) => parameter.name === name))
					parameters.push({
						name,
						in: 'path',
						required: true,
						schema: { type: 'string' },
					});
				return `{${name}}`;
			})
			.join('/');
		const tag = path.split('/')[2];
		if (tag === undefined || tag.length === 0 || path.includes('*'))
			throw new Error(`Unsupported OpenAPI route: ${route.path}`);
		const item = paths[path] ?? {};
		item[method] ??= describeTypedOperation(method, route.path, {
			tags: [tag],
			parameters,
			responses: { default: { description: 'APIの応答' } },
		});
		paths[path] = item;
	}
	return {
		openapi: '3.1.0' as const,
		info: {
			title: 'altair',
			version: 'v1',
		},
		servers: [{ url: '/' }],
		components: {
			schemas: gameContractSchemas,
			securitySchemes: {
				sessionToken: { type: 'http' as const, scheme: 'bearer' },
			},
		},
		paths: Object.fromEntries(
			Object.entries(paths).sort(([left], [right]) =>
				left.localeCompare(right),
			),
		),
	};
}
