import type { JsonObject } from '../state/json-state-utils.ts';
import { createDefaultResponseHeaders } from '../v1/http/response-header-definitions.ts';
import generated from './generated/contracts.json';
import type { ApiOperation } from './operation.ts';
import { createSchemaExample } from './schemaExample.ts';

export const gameContractSchemas: Readonly<Record<string, JsonObject>> =
	generated.schemas;
const endpoints = new Map(
	generated.endpoints.map((endpoint) => [
		`${endpoint.method} ${endpoint.path}`,
		endpoint,
	]),
);

export function describeTypedOperation(
	method: string,
	path: string,
	operation: ApiOperation,
): ApiOperation {
	const endpoint = endpoints.get(`${method} ${path}`);
	if (endpoint === undefined) return operation;
	const headers = endpoint.requiresSession
		? {
				headers: Object.fromEntries(
					createDefaultResponseHeaders()
						.filter(([name]) => name.toLowerCase() !== 'content-type')
						.map(([name]) => [name, { schema: { type: 'string' } }]),
				),
			}
		: {};
	const requestSchema = {
		$ref: `#/components/schemas/${endpoint.requestSchema}`,
	};
	const responseSchema = {
		$ref: `#/components/schemas/${endpoint.responseSchema}`,
	};
	const requestExample = createSchemaExample(
		requestSchema,
		gameContractSchemas,
	);
	const required =
		requestExample !== null &&
		typeof requestExample === 'object' &&
		Object.keys(requestExample).length > 0;
	const input =
		method === 'get' || method === 'head'
			? {
					parameters: [
						...operation.parameters,
						{
							name: 'query',
							in: 'query' as const,
							required,
							style: 'form' as const,
							explode: true,
							schema: requestSchema,
							example: requestExample,
						},
					],
				}
			: {
					requestBody: {
						required,
						content: {
							'application/json': {
								schema: requestSchema,
								example: requestExample,
							},
						},
					},
				};
	return {
		...operation,
		...input,
		...(endpoint.requiresSession ? { security: [{ sessionToken: [] }] } : {}),
		responses: {
			...(endpoint.requiresSession
				? {
						'401': {
							description: 'Unauthorized',
							...headers,
							content: {
								'application/json': {
									schema: {
										$ref: `#/components/schemas/${generated.sessionErrorSchema}`,
									},
									example: createSchemaExample(
										{
											$ref: `#/components/schemas/${generated.sessionErrorSchema}`,
										},
										gameContractSchemas,
									),
								},
							},
						},
					}
				: {}),
			'200': {
				description: 'OK',
				...headers,
				content: {
					'application/json': {
						schema: responseSchema,
						example: createSchemaExample(responseSchema, gameContractSchemas),
					},
				},
			},
		},
	};
}
