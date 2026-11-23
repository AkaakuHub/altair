import { describe, expect, test } from 'bun:test';
import { ensureUserSiscaStore } from '../src/state/sisca-store-state.ts';
import { applyRawServerStateMigrations } from '../src/state-migrations/raw-server-state-migrations.ts';

describe('sisca store state', () => {
	test('reports whether player-scoped state was created', () => {
		const state = { userSiscaStores: [] };
		const master = { itemList: [] };

		const first = ensureUserSiscaStore(state, 'player-a', master);
		const second = ensureUserSiscaStore(state, 'player-a', master);

		expect(first.created).toBe(true);
		expect(second.created).toBe(false);
		expect(second.value).toBe(first.value);
		expect(state.userSiscaStores).toHaveLength(1);
	});

	test('stores only player-specific item values', () => {
		const state = { userSiscaStores: [] };
		const result = ensureUserSiscaStore(state, 'player-a', {
			itemList: [
				{
					siscaStoreDatasId: 1,
					itemType: 2,
					itemId: 3,
					itemNum: 4,
					price: 5,
					isPaidSiscaOnly: false,
					limitNum: 6,
				},
			],
		});

		expect(result.value.itemList).toEqual([
			{
				siscaStoreDatasId: 1,
				buyableNum: 6,
				isNewItem: false,
				isSale: true,
			},
		]);
	});

	test('removes copied master fields from persisted state', () => {
		const item: Record<string, unknown> = {
			siscaStoreDatasId: 1,
			itemType: 2,
			itemId: 3,
			itemNum: 4,
			buyableNum: 5,
			isNewItem: true,
			isSale: false,
			ownNum: 6,
		};
		applyRawServerStateMigrations({
			userSiscaStores: [{ itemList: [item] }],
		});

		expect(item).toEqual({
			siscaStoreDatasId: 1,
			buyableNum: 5,
			isNewItem: true,
			isSale: false,
		});
	});
});
