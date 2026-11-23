import { describe, expect, test } from 'bun:test';
import type { CardGrowthMasterSource } from '../src/application/card-growth/card-growth-master-source.ts';
import { createCheckStyleLevelUpResponse } from '../src/application/card-growth/card-style-level-service.ts';
import type { UserCardCollectionState } from '../src/state/user-card-aggregate-state.ts';
import type { UserInventoryState } from '../src/state/user-item-definition.ts';

describe('card growth service', () => {
	test('uses the injected master source without a database dependency', () => {
		const requestedLevels: Array<[number, number, number]> = [];
		const masterSource: CardGrowthMasterSource = {
			getStyleLevelCost: (cardDatasId, currentLevel, targetLevel) => {
				requestedLevels.push([cardDatasId, currentLevel, targetLevel]);
				return 40;
			},
			getLimitBreakRequirements: () => undefined,
			getSkillLevelUpRequirements: () => undefined,
			getEvolutionRequirement: () => undefined,
			getCardTemplate: () => undefined,
		};
		const cards: UserCardCollectionState = {
			playerId: 'player',
			userCardDataList: [
				{
					d_card_datas_id: 'owned-card',
					card_datas_id: 101,
					style_level: 3,
					max_style_level: 5,
				},
			],
		};
		const inventory: UserInventoryState = {
			playerId: 'player',
			itemCategoryList: [
				{
					itemCategory: 4,
					userItemList: [
						{
							userItemId: 'style-point',
							itemId: 3_004_000,
							itemNum: 50,
							itemType: 4,
							limitDateTime: null,
							rarity: 1,
							resourceFileName: '',
						},
					],
				},
			],
		};

		expect(
			createCheckStyleLevelUpResponse(
				masterSource,
				{ d_card_datas_id: 'owned-card' },
				cards,
				inventory,
			),
		).toEqual({
			is_possible: true,
			current_style_level: 3,
			selectable_max_level: 5,
			style_point: 50,
		});
		expect(requestedLevels).toEqual([[101, 3, 4]]);
	});
});
