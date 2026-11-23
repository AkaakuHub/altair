import { describe, expect, test } from 'bun:test';
import { createStickerIdentityFingerprint } from '../src/master-data/sticker-identity.ts';

describe('sticker identity', () => {
	test('uses ownership entity structure only', () => {
		const structure = {
			id: 10,
			category_type: 2,
			season_id: 103,
			characters_id: 1021,
			is_variant: 1,
		};

		expect(createStickerIdentityFingerprint({ ...structure })).toEqual({
			domain: 'sticker',
			value: '[10,2,103,1021,1]',
		});
	});
});
