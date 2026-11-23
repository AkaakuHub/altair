import { describe, expect, test } from 'bun:test';
import type { CardGrowthMutationGuard } from '../../src/application/card-growth/card-growth-mutation-guard.ts';
import {
	applyRhythmGameSkillLevelUp,
	type RhythmGameSkillLevelMasterSource,
	type RhythmGameSkillLevelRequirement,
} from '../../src/application/card-growth/rhythm-game-skill-level-service.ts';
import type { UserCardCollectionState } from '../../src/state/user-card-aggregate-state.ts';
import type { UserInventoryState } from '../../src/state/user-item-definition.ts';

const requirements: RhythmGameSkillLevelRequirement[] = [
	{ skillLevel: 1, itemId: 101, costNum: 5 },
	{ skillLevel: 1, itemId: 102, costNum: 15 },
	{ skillLevel: 2, itemId: 101, costNum: 7 },
	{ skillLevel: 2, itemId: 102, costNum: 30 },
];
const master: RhythmGameSkillLevelMasterSource = {
	getRequirements: () => requirements,
};
const guard: CardGrowthMutationGuard = { preflight: () => true };

function fixture() {
	const cards: UserCardCollectionState = {
		playerId: 'player',
		userCardDataList: [
			{
				d_card_datas_id: 'owned',
				card_datas_id: 19525011,
				limit_break_times: 1,
				skill_list: [{ skill_type: 1, skill_level: 6 }],
				rhythm_game_skill_list: [
					{ rhythm_game_skill_type: 1, skill_level: 1 },
					{ rhythm_game_skill_type: 2, skill_level: 1 },
				],
			},
		],
	};
	const inventory: UserInventoryState = {
		playerId: 'player',
		itemCategoryList: [
			{
				itemCategory: 6,
				userItemList: [101, 102].map((itemId) => ({
					userItemId: String(itemId),
					itemId,
					itemNum: 50,
					itemType: 6,
					limitDateTime: null,
					rarity: 1,
					resourceFileName: '',
				})),
			},
		],
	};
	return { cards, inventory };
}
const body = {
	d_card_datas_id: 'owned',
	rhythm_game_skill_type: 2,
	skill_level: 3,
};

describe('rhythm game skill level up', () => {
	test('全素材をレベル間で合算し、指定したスキルだけを更新する', () => {
		const { cards, inventory } = fixture();
		const calls: number[][] = [];
		expect(
			applyRhythmGameSkillLevelUp(
				{
					getRequirements: (...args) => {
						calls.push(args);
						return requirements;
					},
				},
				body,
				cards,
				inventory,
				guard,
			),
		).toBe('ok');
		expect(calls).toEqual([[19525011, 2, 1, 3]]);
		expect(
			inventory.itemCategoryList[0]?.userItemList.map((item) => item.itemNum),
		).toEqual([38, 5]);
		expect(cards.userCardDataList[0]?.rhythm_game_skill_list).toEqual([
			{ rhythm_game_skill_type: 1, skill_level: 1 },
			{ rhythm_game_skill_type: 2, skill_level: 3 },
		]);
		expect(cards.userCardDataList[0]?.skill_list).toEqual([
			{ skill_type: 1, skill_level: 6 },
		]);
	});
	test('素材不足と定義不一致ではカードと所持品を変更しない', () => {
		for (const incompatible of [false, true]) {
			const data = fixture();
			const item = data.inventory.itemCategoryList[0]?.userItemList[1];
			if (!item) throw new Error('Item fixture is absent');
			if (!incompatible) item.itemNum = 44;
			const before = structuredClone(data);
			expect(
				applyRhythmGameSkillLevelUp(master, body, data.cards, data.inventory, {
					preflight: () => !incompatible,
				}),
			).toBe(incompatible ? 'incompatibleDefinition' : 'insufficientItem');
			expect(data).toEqual(before);
		}
	});
	test('限界突破数に10を加えた上限まで強化できる', () => {
		const data = fixture();
		const source: RhythmGameSkillLevelMasterSource = {
			getRequirements: (cardId, type, before, after) => {
				expect([cardId, type]).toEqual([19525011, 1]);
				const costs: RhythmGameSkillLevelRequirement[] = [];
				for (let level = before; level < after; level += 1)
					costs.push({ skillLevel: level, itemId: 101, costNum: 1 });
				return costs;
			},
		};
		expect(
			applyRhythmGameSkillLevelUp(
				source,
				{ ...body, rhythm_game_skill_type: 1, skill_level: 11 },
				data.cards,
				data.inventory,
				guard,
			),
		).toBe('ok');
		const before = structuredClone(data);
		expect(
			applyRhythmGameSkillLevelUp(
				source,
				{ ...body, skill_level: 12 },
				data.cards,
				data.inventory,
				guard,
			),
		).toBe('cardNotFound');
		expect(data).toEqual(before);
	});
	test('不正な種別・レベル・所有カードと欠損した素材定義を拒否する', () => {
		for (const request of [
			{ ...body, rhythm_game_skill_type: 3 },
			{ ...body, skill_level: 2.5 },
			{ ...body, skill_level: 1 },
			{ ...body, d_card_datas_id: 'another-user-card' },
		]) {
			const data = fixture();
			const before = structuredClone(data);
			expect(
				applyRhythmGameSkillLevelUp(
					master,
					request,
					data.cards,
					data.inventory,
					guard,
				),
			).not.toBe('ok');
			expect(data).toEqual(before);
		}
		for (const costs of [
			undefined,
			[],
			requirements.filter((row) => row.skillLevel === 1),
		]) {
			const data = fixture();
			const before = structuredClone(data);
			expect(
				applyRhythmGameSkillLevelUp(
					{ getRequirements: () => costs },
					body,
					data.cards,
					data.inventory,
					guard,
				),
			).toBe('masterDataNotFound');
			expect(data).toEqual(before);
		}
	});
});
