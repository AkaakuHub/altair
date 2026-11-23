import { expect, test } from 'bun:test';
import { createGameOpenApiDocument } from '../../src/apiDocumentation/document.ts';
import { createContractValidator } from '../../tools/apiDocumentation/contractValidation.ts';
import { createTestApp } from '../test-app.ts';

test('認証が必要なAPIの401応答が共通契約に適合する', async () => {
	const app = createTestApp({ requestLogEnabled: false });
	const document = createGameOpenApiDocument(app.routes);
	const validate = createContractValidator(document.components.schemas);
	let checked = 0;
	for (const [path, methods] of Object.entries(document.paths)) {
		for (const [method, operation] of Object.entries(methods)) {
			if (operation.security === undefined) continue;
			expect(operation.security).toEqual([{ sessionToken: [] }]);
			const schema =
				operation.responses['401']?.content?.['application/json'].schema;
			if (schema === undefined)
				throw new Error(`Missing session contract: ${path}`);
			const response = await app.request(path, {
				method: method.toUpperCase(),
				headers: { authorization: 'Bearer invalid-session' },
				...(method === 'get'
					? {}
					: {
							body: JSON.stringify(
								operation.requestBody?.content['application/json'].example ??
									{},
							),
						}),
			});
			expect(response.status).toBe(401);
			validate(schema, await response.json());
			const headers = operation.responses['401']?.headers;
			if (headers === undefined)
				throw new Error('Missing response header contract');
			for (const name of Object.keys(headers))
				expect(response.headers.has(name)).toBe(true);
			checked++;
		}
	}
	expect(checked).toBe(142);
	expect(
		document.paths['/v1/register/set_new_user']?.post?.security,
	).toBeUndefined();
	expect(document.components.securitySchemes.sessionToken).toEqual({
		type: 'http',
		scheme: 'bearer',
	});
}, 60_000);
