import { describe, expect, test } from 'bun:test';
import type { UserCardDataState } from '../src/state/user-card-types.ts';
import { createOfficialUserCardData } from '../src/v1/responses/user-card-response.ts';

describe('user card response projection', () => {
	test('canonical provenanceを除外して既存公式fieldを保持する', () => {
		const card: UserCardDataState = {
			d_card_datas_id: 'owned-card',
			card_datas_id: 1001,
			card_name: 'card',
			style_level: 10,
			source_master_release_id: 'release-a',
			identity_fingerprint: { domain: 'card', value: 'fingerprint-a' },
		};

		expect(createOfficialUserCardData(card)).toEqual({
			d_card_datas_id: 'owned-card',
			card_datas_id: 1001,
			card_name: 'card',
			style_level: 10,
		});
		expect(card.source_master_release_id).toBe('release-a');
	});
});
