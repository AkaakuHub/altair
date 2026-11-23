import { describe, expect, test } from 'bun:test';
import { parseArchiveListRequest } from '../src/v1/responses/archive-list-request-parser.ts';

describe('archive list request parser', () => {
	test('不正なpaginationを既存の既定値へ正規化する', () => {
		expect(
			parseArchiveListRequest({
				offset: -1,
				limit: 0,
				characters: [
					{ character_id: 10, appearance: 1 },
					{ character_id: 'invalid' },
				],
			}),
		).toEqual({
			characters: [{ characterId: 10, appearance: 1 }],
			offset: 0,
		});
	});
});
