import { expect } from 'bun:test';
import type { Hono } from 'hono';
import { createGameOpenApiDocument } from '../../src/apiDocumentation/document.ts';
import type { JsonObject } from '../../src/state/json-state-utils.ts';
import { createContractValidator } from '../../tools/apiDocumentation/contractValidation.ts';

export function createDocumentedRequest(app: Hono) {
	const document = createGameOpenApiDocument(app.routes);
	const validate = createContractValidator(document.components.schemas);
	return async (
		method: 'get' | 'post' | 'put',
		path: string,
		body: JsonObject = {},
		headers?: HeadersInit,
	): Promise<unknown> => {
		const operation = document.paths[path]?.[method];
		const requestSchema =
			method === 'get'
				? operation?.parameters.find((parameter) => parameter.in === 'query')
						?.schema
				: operation?.requestBody?.content['application/json'].schema;
		const responseSchema =
			operation?.responses['200']?.content?.['application/json'].schema;
		if (requestSchema === undefined || responseSchema === undefined)
			throw new Error(`Contract is missing: ${method} ${path}`);
		validate(requestSchema, body);
		const query = new URLSearchParams();
		if (method === 'get')
			for (const [key, value] of Object.entries(body)) {
				if (
					typeof value !== 'string' &&
					typeof value !== 'number' &&
					typeof value !== 'boolean'
				)
					throw new Error(
						'Query contract fixture must contain primitive values',
					);
				query.set(key, String(value));
			}
		const response = await app.request(
			method === 'get' ? `${path}?${query}` : path,
			{
				method: method.toUpperCase(),
				...(headers === undefined ? {} : { headers }),
				...(method === 'get' ? {} : { body: JSON.stringify(body) }),
			},
		);
		expect(response.status).toBe(200);
		for (const name of Object.keys(operation?.responses['200']?.headers ?? {}))
			expect(response.headers.has(name)).toBe(true);
		const value: unknown = await response.json();
		validate(responseSchema, value);
		return value;
	};
}
