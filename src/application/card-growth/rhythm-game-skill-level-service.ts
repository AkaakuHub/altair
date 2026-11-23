import { isRecord } from '../../state/json-state-utils.ts';
import {
	findUserCard,
	type UserCardCollectionState,
} from '../../state/user-card-aggregate-state.ts';
import type { UserRhythmGameSkillState } from '../../state/user-card-types.ts';
import type { UserInventoryState } from '../../state/user-item-definition.ts';
import {
	consumeUserItemFromLookup,
	createUserItemLookup,
	getCardGrowthNumberField,
	getCardGrowthStringField,
	getOwnItemNum,
} from './card-growth-items.ts';
import type { CardGrowthMutationGuard } from './card-growth-mutation-guard.ts';

export type RhythmGameSkillType = 1 | 2;
export type RhythmGameSkillLevelRequirement = {
	skillLevel: number;
	itemId: number;
	costNum: number;
};
export type RhythmGameSkillLevelMasterSource = {
	getRequirements: (
		cardDatasId: number,
		skillType: RhythmGameSkillType,
		before: number,
		after: number,
	) => readonly RhythmGameSkillLevelRequirement[] | undefined;
};

export function applyRhythmGameSkillLevelUp(
	masterSource: RhythmGameSkillLevelMasterSource,
	body: unknown,
	cards: UserCardCollectionState,
	inventory: UserInventoryState,
	mutationGuard: CardGrowthMutationGuard,
):
	| 'ok'
	| 'cardNotFound'
	| 'masterDataNotFound'
	| 'unavailable'
	| 'insufficientItem'
	| 'incompatibleDefinition' {
	const card = findUserCard(
		cards,
		getCardGrowthStringField(body, 'd_card_datas_id'),
	);
	const skillType = getCardGrowthNumberField(body, 'rhythm_game_skill_type');
	const targetLevel = getCardGrowthNumberField(body, 'skill_level');
	if (
		!card ||
		(skillType !== 1 && skillType !== 2) ||
		targetLevel === undefined ||
		!Number.isSafeInteger(targetLevel)
	)
		return 'cardNotFound';
	const limitBreakTimes = getCardGrowthNumberField(card, 'limit_break_times');
	const skill = Array.isArray(card.rhythm_game_skill_list)
		? card.rhythm_game_skill_list.find(
				(value): value is UserRhythmGameSkillState =>
					isRecord(value) &&
					value.rhythm_game_skill_type === skillType &&
					typeof value.skill_level === 'number',
			)
		: undefined;
	if (
		!skill ||
		limitBreakTimes === undefined ||
		!Number.isSafeInteger(limitBreakTimes) ||
		limitBreakTimes < 0 ||
		!Number.isSafeInteger(skill.skill_level) ||
		skill.skill_level < 1 ||
		targetLevel > 10 + limitBreakTimes
	)
		return 'cardNotFound';
	if (targetLevel <= skill.skill_level) return 'unavailable';
	const requirements = masterSource.getRequirements(
		card.card_datas_id,
		skillType,
		skill.skill_level,
		targetLevel,
	);
	if (!requirements) return 'masterDataNotFound';
	const levels = new Set<number>();
	const totalCost = new Map<number, number>();
	for (const requirement of requirements) {
		if (
			!Number.isSafeInteger(requirement.skillLevel) ||
			requirement.skillLevel < skill.skill_level ||
			requirement.skillLevel >= targetLevel ||
			!Number.isSafeInteger(requirement.itemId) ||
			requirement.itemId <= 0 ||
			!Number.isSafeInteger(requirement.costNum) ||
			requirement.costNum <= 0
		)
			return 'masterDataNotFound';
		levels.add(requirement.skillLevel);
		const cost = (totalCost.get(requirement.itemId) ?? 0) + requirement.costNum;
		if (!Number.isSafeInteger(cost)) return 'masterDataNotFound';
		totalCost.set(requirement.itemId, cost);
	}
	if (levels.size !== targetLevel - skill.skill_level)
		return 'masterDataNotFound';
	const itemLookup = createUserItemLookup(inventory);
	for (const [itemId, cost] of totalCost) {
		if (getOwnItemNum(itemLookup, itemId) < cost) return 'insufficientItem';
	}
	const mutationItems = [...totalCost.keys()].map((itemId) =>
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
	for (const [itemId, cost] of totalCost)
		consumeUserItemFromLookup(itemLookup, itemId, cost);
	skill.skill_level = targetLevel;
	return 'ok';
}
