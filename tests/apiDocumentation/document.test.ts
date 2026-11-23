import { expect, test } from 'bun:test';
import { createGameOpenApiDocument } from '../../src/apiDocumentation/document.ts';

test('登録されたゲームAPIのmethodとpathだけを重複なく公開する', () => {
	const document = createGameOpenApiDocument([
		{ method: 'ALL', path: '/v1/*' },
		{ method: 'GET', path: '/health' },
		{ method: 'POST', path: '/admin/edit' },
		{ method: 'GET', path: '/v1/openapi.json' },
		{ method: 'GET', path: '/v1/docs/' },
		{ method: 'GET', path: '/v1/docs/swagger-ui.css' },
		{ method: 'POST', path: '/v1/register/set_new_user' },
		{ method: 'POST', path: '/v1/register/set_new_user' },
		{ method: 'GET', path: '/v1/archive/withlive_info' },
	]);
	expect(Object.keys(document.paths)).toEqual([
		'/v1/archive/withlive_info',
		'/v1/register/set_new_user',
	]);
	expect(
		Object.keys(document.paths['/v1/register/set_new_user'] ?? {}),
	).toEqual(['post']);
	expect(document.paths['/v1/archive/withlive_info']?.get?.tags).toEqual([
		'archive',
	]);
});

test('Honoのpath parameterを必須のOpenAPI parameterへ変換する', () => {
	const document = createGameOpenApiDocument([
		{ method: 'GET', path: '/v1/items/:id{[0-9]+}' },
	]);
	expect(document.paths['/v1/items/{id}']?.get?.parameters).toEqual([
		{ name: 'id', in: 'path', required: true, schema: { type: 'string' } },
	]);
});

test('記述できないゲームAPIのwildcardを見落とさず拒否する', () => {
	expect(() =>
		createGameOpenApiDocument([{ method: 'GET', path: '/v1/items/*' }]),
	).toThrow('Unsupported OpenAPI route');
});
