import { expect, test } from 'bun:test';
import { createGameOpenApiDocument } from '../../src/apiDocumentation/document.ts';
import contractData from '../../src/apiDocumentation/generated/contracts.json';
import { gameContractSchemas } from '../../src/apiDocumentation/typedOperation.ts';
import { createApp } from '../../src/server.ts';
import { createNoopServerStateStore } from '../../src/server-state-store-port.ts';
import {
	createContractValidator,
	validateContractExamples,
} from '../../tools/apiDocumentation/contractValidation.ts';
import { config } from '../test-app.ts';

test('異なる要素型の配列はそれぞれの契約で検証する', () => {
	const validate = createContractValidator(gameContractSchemas);
	const cases = [
		{
			name: 'ChapterRewardsResponse',
			valid: {
				point_reward: [
					{
						chapter_point_rewards_id: 1,
						required_point: 10,
						status: 0,
						reward_datas: [],
					},
				],
			},
			invalid: { point_reward: [{ rarity: 1, limit_break_material_num: 2 }] },
		},
		{
			name: 'LimitBreakMaterialConvertListResponse',
			valid: {
				convert_limit_break_material_list: [
					{ rarity: 1, limit_break_material_num: 2 },
				],
			},
			invalid: {
				convert_limit_break_material_list: [
					{
						chapter_point_rewards_id: 1,
						required_point: 10,
						status: 0,
						reward_datas: [],
					},
				],
			},
		},
		{
			name: 'RhythmGameDeckModifyRequest',
			valid: {
				modify_deck_list: [
					{ deck_no: 1, name: 'Sample deck', deck_card_list: [] },
				],
			},
			invalid: { modify_deck_list: [{ deck_no: 'invalid' }] },
		},
	];
	for (const entry of cases) {
		const name = Object.keys(gameContractSchemas).find((key) =>
			key.startsWith(`${entry.name}.`),
		);
		if (name === undefined) throw new Error(`Missing contract: ${entry.name}`);
		const reference = { $ref: `#/components/schemas/${name}` };
		expect(() => validate(reference, entry.valid)).not.toThrow();
		expect(() => validate(reference, entry.invalid)).toThrow();
	}
});

test('文書の契約は実際のゲームルートと一致し、すべての例がschemaに適合する', async () => {
	const generated = {
		sessionErrorSchema: contractData.sessionErrorSchema,
		schemas: gameContractSchemas,
		endpoints: contractData.endpoints,
	};
	const app = createApp({
		...config,
		stateStore: createNoopServerStateStore(),
	});
	const routes = new Set(
		app.routes.map((route) => `${route.method.toLowerCase()} ${route.path}`),
	);
	expect(generated.endpoints.length).toBeGreaterThan(0);
	for (const endpoint of generated.endpoints)
		expect(routes.has(`${endpoint.method} ${endpoint.path}`)).toBe(true);
	const document = createGameOpenApiDocument(app.routes);
	for (const endpoint of generated.endpoints) {
		const operation = Object.entries(document.paths[endpoint.path] ?? {}).find(
			([method]) => method === endpoint.method,
		)?.[1];
		expect(operation?.responses).not.toHaveProperty('default');
		expect(
			operation?.responses['200']?.content?.['application/json'].schema,
		).toEqual({ $ref: `#/components/schemas/${endpoint.responseSchema}` });
	}
	const operationCount = Object.values(document.paths).reduce(
		(count, operations) => count + Object.keys(operations).length,
		0,
	);
	expect(generated.endpoints).toHaveLength(operationCount);
	console.info(
		`API contract coverage: ${generated.endpoints.length}/${operationCount}`,
	);
	const documented = new Set(
		generated.endpoints.map(
			(endpoint) => `${endpoint.method} ${endpoint.path}`,
		),
	);
	console.info(
		'Missing API contracts:',
		Object.entries(document.paths).flatMap(([path, operations]) =>
			Object.keys(operations)
				.filter((method) => !documented.has(`${method} ${path}`))
				.map((method) => `${method} ${path}`),
		),
	);
	validateContractExamples(generated);
	const response = await app.request('/v1/openapi.json');
	expect(response.status).toBe(200);
	expect(await response.json()).toEqual(document);
}, 60_000);

test('配信GETのqueryは実際のsnake_case名と任意offsetを使い、POSTはJSON bodyを記述する', () => {
	const document = createGameOpenApiDocument([
		{ method: 'GET', path: '/v1/withlive/live_info' },
		{ method: 'POST', path: '/v1/withlive/enter' },
	]);
	const query = document.paths['/v1/withlive/live_info']?.get;
	expect(query?.requestBody).toBeUndefined();
	expect(query?.parameters).toMatchObject([
		{
			in: 'query',
			style: 'form',
			explode: true,
			example: { live_id: 'sample' },
		},
	]);
	const body = document.paths['/v1/withlive/enter']?.post;
	expect(body?.requestBody?.content['application/json'].example).toEqual({
		live_id: 'sample',
	});
	expect(
		body?.responses['200']?.content?.['application/json'].schema,
	).toHaveProperty('$ref');
});
