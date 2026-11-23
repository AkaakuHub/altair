import { describe, expect, test } from 'bun:test';
import { createCardGrowthMutationGuard } from '../src/application/card-growth/card-growth-mutation-guard.ts';
import { classifyOwnedEntityMutation } from '../src/application/user-owned-entity-mutation.ts';

const itemFingerprint = { domain: 'item', value: '[1,4,0,1]' } as const;

describe('user owned entity mutation', () => {
	test('distinguishes compatible, absent, changed, and unknown definitions', () => {
		expect(
			classifyOwnedEntityMutation(1, itemFingerprint, itemFingerprint),
		).toBe('compatible');
		expect(classifyOwnedEntityMutation(1, itemFingerprint, undefined)).toBe(
			'absent',
		);
		expect(
			classifyOwnedEntityMutation(1, itemFingerprint, {
				domain: 'item',
				value: '[1,4,0,2]',
			}),
		).toBe('changed');
		expect(classifyOwnedEntityMutation(1, undefined, itemFingerprint)).toBe(
			'changed',
		);
	});
});

describe('card growth mutation guard', () => {
	test('rejects unknown provenance without changing canonical values', () => {
		const card = {
			d_card_datas_id: 'card-a',
			card_datas_id: 10,
			style_level: 1,
		};
		const item = {
			userItemId: 'item-a',
			itemId: 20,
			itemNum: 100,
			itemType: 4,
			limitDateTime: null,
			rarity: 4,
			resourceFileName: '',
		};
		const guard = createCardGrowthMutationGuard({
			sourceMasterReleaseId: 'target',
			getCardFingerprint: () => ({ domain: 'card', value: 'card-10' }),
			getItemFingerprint: () => ({ domain: 'item', value: 'item-20' }),
		});

		expect(guard.preflight(card, [item])).toBe(false);
		expect(card.style_level).toBe(1);
		expect(item.itemNum).toBe(100);
	});

	test('accepts matching card and item fingerprints', () => {
		const cardFingerprint = { domain: 'card', value: 'card-10' } as const;
		const itemFingerprint = { domain: 'item', value: 'item-20' } as const;
		const guard = createCardGrowthMutationGuard({
			sourceMasterReleaseId: 'target',
			getCardFingerprint: () => cardFingerprint,
			getItemFingerprint: () => itemFingerprint,
		});

		expect(
			guard.preflight(
				{
					d_card_datas_id: 'card-a',
					card_datas_id: 10,
					identity_fingerprint: cardFingerprint,
				},
				[
					{
						userItemId: 'item-a',
						itemId: 20,
						itemNum: 100,
						itemType: 4,
						limitDateTime: null,
						rarity: 4,
						resourceFileName: '',
						identityFingerprint: itemFingerprint,
					},
				],
			),
		).toBe(true);
	});

	test('rejects changed legacy identity without adopting provenance', () => {
		const card = {
			d_card_datas_id: 'card-a',
			card_datas_id: 10,
			character_id: 1021,
		};
		const item = {
			userItemId: 'item-a',
			itemId: 20,
			itemNum: 100,
			itemType: 4,
			itemCategory: 0,
			limitDateTime: null,
			rarity: 4,
			resourceFileName: '',
		};
		const guard = createCardGrowthMutationGuard({
			sourceMasterReleaseId: 'target',
			getCardFingerprint: () => ({
				domain: 'card',
				value: JSON.stringify([10, 1, 9999, 0]),
			}),
			getItemFingerprint: () => ({
				domain: 'item',
				value: JSON.stringify([20, 4, 0]),
			}),
		});

		expect(guard.preflight(card, [item])).toBe(false);
		expect(card).not.toHaveProperty('source_master_release_id');
		expect(item).not.toHaveProperty('sourceMasterReleaseId');
		expect(item.itemNum).toBe(100);
	});
});
