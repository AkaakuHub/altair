import { describe, expect, test } from 'bun:test';
import { ensureUserShopExchangeState } from '../src/state/shop-exchange-aggregate.ts';
import type { ShopExchangeMaster } from '../src/state/shop-exchange-definition.ts';
import { applyRawServerStateMigrations } from '../src/state-migrations/raw-server-state-migrations.ts';

const master: ShopExchangeMaster = {
	isConvertibleLimitBreakMaterial: true,
	shopList: [],
	gpPrizeExchangeList: [],
	gpPrizeUserTicketList: [],
	itemExchangeList: [],
	stickerExchangeList: [],
};

describe('user shop exchange state', () => {
	test('returns whether the player state was created', () => {
		const state = { userShopExchanges: [] };
		const created = ensureUserShopExchangeState(state, 'player-1', master);
		const existing = ensureUserShopExchangeState(state, 'player-1', master);

		expect(created.created).toBe(true);
		expect(existing.created).toBe(false);
		expect(existing.value).toBe(created.value);
	});

	test('stores only player-specific shop values', () => {
		const state = { userShopExchanges: [] };
		const result = ensureUserShopExchangeState(state, 'player-1', {
			...master,
			shopList: [
				{
					shopType: 1,
					name: 'release shop',
					orderId: 2,
					isExistProducts: true,
				},
			],
		});

		expect(result.value).toEqual({
			playerId: 'player-1',
			shopList: [{ shopType: 1, isMaintenance: false }],
			petalExchangePurchaseList: [],
			gpPrizeExchangeList: [],
			itemExchangeList: [],
		});
	});

	test('removes copied master fields from persisted state', () => {
		const item: Record<string, unknown> = {
			itemExchangesId: 1,
			isLock: false,
			remainingExchangeNum: 2,
			userMaterialItemNum: 3,
			userProductItemNum: 4,
		};
		const shop: Record<string, unknown> = {
			shopType: 1,
			name: 'old shop',
			orderId: 2,
			isExistProducts: true,
			isMaintenance: true,
		};
		applyRawServerStateMigrations({
			userShopExchanges: [
				{
					isConvertibleLimitBreakMaterial: true,
					gpPrizeUserTicketList: [{ itemId: 1, userNum: 2 }],
					shopList: [shop],
					itemExchangeList: [item],
				},
			],
		});

		expect(shop).toEqual({ shopType: 1, isMaintenance: true });
		expect(item).toEqual({
			itemExchangesId: 1,
			isLock: false,
			remainingExchangeNum: 2,
		});
	});
});
