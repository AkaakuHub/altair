import { isRecord } from '../../state/json-state-utils.ts';
import {
	findUserCard,
	type UserCardCollectionState,
} from '../../state/user-card-aggregate-state.ts';
import type {
	UserCardDataState,
	UserCardSkillState,
} from '../../state/user-card-types.ts';
import type { UserInventoryState } from '../../state/user-item-definition.ts';
import {
	consumeUserItemFromLookup,
	createUserItemLookup,
	getCardGrowthNumberField,
	getCardGrowthStringField,
	getOwnItemNum,
	uniqueNumbers,
} from './card-growth-items.ts';
import type { CardGrowthMasterSource } from './card-growth-master-source.ts';
import type { CardGrowthMutationGuard } from './card-growth-mutation-guard.ts';
import type { SkillLevelUpCheckResponse } from './card-growth-response.ts';

export function createCheckSkillLevelUpResponse(
	masterSource: CardGrowthMasterSource,
	body: unknown,
	cards: UserCardCollectionState,
	inventory: UserInventoryState,
): SkillLevelUpCheckResponse | 'masterDataNotFound' | undefined {
	const dCardDatasId = getCardGrowthStringField(body, 'd_card_datas_id');
	const skillType = getCardGrowthNumberField(body, 'skill_type');
	const card = findUserCard(cards, dCardDatasId);
	if (!card || skillType === undefined) {
		return undefined;
	}
	const cardDatasId = getCardGrowthNumberField(card, 'card_datas_id');
	const skill = findCardSkill(card, skillType);
	if (!skill || cardDatasId === undefined) {
		return undefined;
	}
	const currentSkillLevel = getCardGrowthNumberField(skill, 'skill_level');
	const selectableMaxLevel = getCardGrowthNumberField(skill, 'max_skill_level');
	if (currentSkillLevel === undefined || selectableMaxLevel === undefined) {
		return undefined;
	}
	const requirements =
		currentSkillLevel < selectableMaxLevel
			? masterSource.getSkillLevelUpRequirements(
					cardDatasId,
					skillType,
					currentSkillLevel,
					selectableMaxLevel,
				)
			: [];
	if (requirements === undefined) {
		return 'masterDataNotFound';
	}
	const requiredItemIds = uniqueNumbers(
		requirements.flatMap(skillRequirementItemIds),
	);
	const itemLookup = createUserItemLookup(inventory);
	return {
		is_possible: requirements.length > 0,
		current_skill_level: currentSkillLevel,
		selectable_max_level: selectableMaxLevel,
		user_item_list: requiredItemIds.map((itemId) => ({
			item_id: itemId,
			own_num: getOwnItemNum(itemLookup, itemId),
		})),
		required_item_list: requirements.map((requirement) => ({
			cost_item_id1: requirement.costItemId1,
			cost_num1: requirement.costNum1,
			cost_item_id2: requirement.costItemId2,
			cost_num2: requirement.costNum2,
			cost_item_id3: requirement.costItemId3,
			cost_num3: requirement.costNum3,
		})),
	};
}

export function applySkillLevelUp(
	masterSource: CardGrowthMasterSource,
	body: unknown,
	cards: UserCardCollectionState,
	inventory: UserInventoryState,
	mutationGuard: CardGrowthMutationGuard,
	updateCard: (update: {
		dCardDatasId: string;
		skillType: number;
		skillLevel: number;
	}) => boolean,
):
	| 'ok'
	| 'cardNotFound'
	| 'masterDataNotFound'
	| 'unavailable'
	| 'insufficientItem'
	| 'incompatibleDefinition' {
	const dCardDatasId = getCardGrowthStringField(body, 'd_card_datas_id');
	const skillType = getCardGrowthNumberField(body, 'skill_type');
	const targetSkillLevel = getCardGrowthNumberField(body, 'skill_level');
	const card = findUserCard(cards, dCardDatasId);
	if (!card || skillType === undefined || targetSkillLevel === undefined) {
		return 'cardNotFound';
	}
	const cardDatasId = getCardGrowthNumberField(card, 'card_datas_id');
	const skill = findCardSkill(card, skillType);
	if (!skill || cardDatasId === undefined) {
		return 'cardNotFound';
	}
	const currentSkillLevel = getCardGrowthNumberField(skill, 'skill_level');
	const maxSkillLevel = getCardGrowthNumberField(skill, 'max_skill_level');
	if (
		currentSkillLevel === undefined ||
		maxSkillLevel === undefined ||
		targetSkillLevel > maxSkillLevel
	) {
		return 'cardNotFound';
	}
	if (targetSkillLevel <= currentSkillLevel) {
		return 'unavailable';
	}
	const requirements = masterSource.getSkillLevelUpRequirements(
		cardDatasId,
		skillType,
		currentSkillLevel,
		targetSkillLevel,
	);
	if (requirements === undefined) {
		return 'masterDataNotFound';
	}
	const totalCostByItemId = new Map<number, number>();
	for (const requirement of requirements) {
		for (const item of skillRequirementItems(requirement)) {
			totalCostByItemId.set(
				item.itemId,
				(totalCostByItemId.get(item.itemId) ?? 0) + item.costNum,
			);
		}
	}
	const itemLookup = createUserItemLookup(inventory);
	for (const [itemId, costNum] of totalCostByItemId) {
		if (getOwnItemNum(itemLookup, itemId) < costNum) {
			return 'insufficientItem';
		}
	}
	const mutationItems = [...totalCostByItemId.keys()].map((itemId) =>
		itemLookup.get(itemId),
	);
	if (
		mutationItems.some((item) => item === undefined) ||
		!mutationGuard.preflight(
			card,
			mutationItems.filter((item) => item !== undefined),
		)
	)
		return 'incompatibleDefinition';
	for (const [itemId, costNum] of totalCostByItemId) {
		if (!consumeUserItemFromLookup(itemLookup, itemId, costNum)) {
			return 'insufficientItem';
		}
	}
	if (!updateCard({ dCardDatasId, skillType, skillLevel: targetSkillLevel })) {
		return 'cardNotFound';
	}
	return 'ok';
}

function findCardSkill(
	card: UserCardDataState,
	skillType: number,
): UserCardSkillState | undefined {
	if (!Array.isArray(card.skill_list)) return undefined;
	return card.skill_list.find(
		(skill): skill is UserCardSkillState =>
			isRecord(skill) &&
			skill.skill_type === skillType &&
			typeof skill.card_skill_series_id === 'number' &&
			typeof skill.skill_level === 'number' &&
			typeof skill.max_skill_level === 'number',
	);
}

function skillRequirementItemIds(requirement: SkillRequirement): number[] {
	return skillRequirementItems(requirement).map((item) => item.itemId);
}

type SkillRequirement = {
	costItemId1: number;
	costNum1: number;
	costItemId2: number;
	costNum2: number;
	costItemId3: number;
	costNum3: number;
};

function skillRequirementItems(
	requirement: SkillRequirement,
): Array<{ itemId: number; costNum: number }> {
	return [
		{ itemId: requirement.costItemId1, costNum: requirement.costNum1 },
		{ itemId: requirement.costItemId2, costNum: requirement.costNum2 },
		{ itemId: requirement.costItemId3, costNum: requirement.costNum3 },
	].filter((item) => item.itemId > 0 && item.costNum > 0);
}
