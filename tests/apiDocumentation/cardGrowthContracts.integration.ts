import { expect, test } from 'bun:test';
import { z } from 'zod';
import { createGameOpenApiDocument } from '../../src/apiDocumentation/document.ts';
import { createCardGrowthMutationResponse } from '../../src/v1/route-support/card-growth-route-result.ts';
import { createContractValidator } from '../../tools/apiDocumentation/contractValidation.ts';
import { createTestApp, registerNewUser } from '../test-app.ts';
import { createDocumentedRequest } from './documentedRequest.ts';

test('所持カードの育成確認4操作がSwagger契約に適合する', async () => {
	const app = createTestApp({ requestLogEnabled: false });
	await registerNewUser(app);
	const request = createDocumentedRequest(app);
	const cards = z
		.object({
			user_card_data_list: z.array(
				z.object({
					d_card_datas_id: z.string(),
					skill_list: z.array(z.object({ skill_type: z.number() })),
				}),
			),
		})
		.parse(await request('post', '/v1/user/card/get_list'));
	const card = cards.user_card_data_list[0];
	const skill = card?.skill_list[0];
	if (card === undefined || skill === undefined)
		throw new Error('Card fixture has no owned card or skill');
	for (const operation of [
		'check_style_level_up',
		'check_evolution',
		'check_limit_break',
		'check_skill_level_up',
	]) {
		const body = {
			d_card_datas_id: card.d_card_datas_id,
			...(operation === 'check_skill_level_up'
				? { skill_type: skill.skill_type }
				: {}),
		};
		const response = z
			.object({ is_possible: z.boolean() })
			.parse(await request('post', `/v1/user/card/${operation}`, body));
		expect(typeof response.is_possible).toBe('boolean');
	}
});

test('育成更新の成功応答は共通生成処理のresult trueを記述する', () => {
	const operations = [
		'style_level_up',
		'skill_level_up',
		'limit_break',
		'evolution',
	];
	const document = createGameOpenApiDocument(
		operations.map((operation) => ({
			method: 'POST',
			path: `/v1/user/card/${operation}`,
		})),
	);
	const validate = createContractValidator(document.components.schemas);
	for (const operation of operations) {
		const schema =
			document.paths[`/v1/user/card/${operation}`]?.post?.responses['200']
				?.content?.['application/json'].schema;
		if (schema === undefined)
			throw new Error('Missing card growth mutation schema');
		expect(() =>
			validate(schema, createCardGrowthMutationResponse()),
		).not.toThrow();
		expect(() => validate(schema, { result: false })).toThrow();
	}
});
