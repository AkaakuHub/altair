import { describe, expect, test } from 'bun:test';
import type { UserCardCollectionState } from '../src/state/user-card-aggregate-state.ts';
import type { UserInventoryState } from '../src/state/user-item-definition.ts';
import { createDreamLiveConditionResponse } from '../src/v1/active-master-database/dream-live-condition.ts';
import {
	type DreamQuestSeriesRow,
	groupDreamLiveConditionRows,
} from '../src/v1/active-master-database/dream-live-master.ts';

const series: DreamQuestSeriesRow = {
	id: 10,
	characters_id: 1031,
	name: '日野下 花帆',
	order_id: 1,
	dream_live_series_list_id: 1001,
};

describe('dream live condition', () => {
	test('card series条件だけを1条件へ集約してmaster順を維持する', () => {
		expect(
			groupDreamLiveConditionRows([
				{ conditions_type: 1, conditions_value: 1 },
				{ conditions_type: 8, conditions_value: 1001 },
				{ conditions_type: 8, conditions_value: 1002 },
				{ conditions_type: 3, conditions_value: 4 },
			]),
		).toEqual([
			{ conditions_type: 1, conditions_values: [1] },
			{ conditions_type: 8, conditions_values: [1001, 1002] },
			{ conditions_type: 3, conditions_values: [4] },
		]);
	});

	test('投影済みinventoryの所持数からitem条件の応答を作る', () => {
		expect(
			createDreamLiveConditionResponse(
				{ conditions_type: 3, conditions_values: [4] },
				series,
				emptyCards(),
				inventoryWithDreamLiveItem(4),
				[],
				'Dream Liveメダル',
			),
		).toEqual({
			condition_text: 'Dream Liveメダルを4個集めよう',
			achieve_count: 4,
			is_release: true,
			is_display_progress_num: true,
		});
	});

	test('複数card series条件は所持しているseries数で判定する', () => {
		expect(
			createDreamLiveConditionResponse(
				{ conditions_type: 8, conditions_values: [1001, 1002] },
				series,
				cardsWithSeries(1001),
				inventoryWithDreamLiveItem(0),
				[],
				undefined,
			),
		).toMatchObject({ achieve_count: 1, is_release: false });
	});
});

function emptyCards(): UserCardCollectionState {
	return { playerId: 'player', userCardDataList: [] };
}

function cardsWithSeries(cardSeriesId: number): UserCardCollectionState {
	return {
		playerId: 'player',
		userCardDataList: [
			{
				d_card_datas_id: 'card',
				card_datas_id: cardSeriesId * 10,
				card_series_id: cardSeriesId,
			},
		],
	};
}

function inventoryWithDreamLiveItem(itemNum: number): UserInventoryState {
	return {
		playerId: 'player',
		itemCategoryList: [
			{
				itemCategory: 1,
				userItemList: [
					{
						userItemId: 'dream-live-item',
						itemId: 3008001,
						itemNum,
						itemType: 1,
						itemCategory: 1,
						limitDateTime: null,
						rarity: 1,
						resourceFileName: '',
					},
				],
			},
		],
	};
}
