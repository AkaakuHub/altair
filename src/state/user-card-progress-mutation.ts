import { isRecord, readNumber } from './json-state-utils.ts';
import {
	findUserCards,
	type UserCardCollectionState,
} from './user-card-aggregate-state.ts';
import { applyUserCardLimitBreakAvailability } from './user-card-training-state.ts';
import type {
	UserCardDataState,
	UserCardSkillState,
	UserCardTemplateState,
	UserRhythmGameSkillState,
} from './user-card-types.ts';

type UserCardCollectionContainer = {
	userCards: UserCardCollectionState[];
};

export function updateUserCardProgress(
	state: UserCardCollectionContainer,
	playerId: string,
	dCardDatasId: string,
	styleLevel: number,
	limitBreakTimes: number,
): boolean {
	const cards = findUserCards(state, playerId);
	if (!cards) return false;
	const card = cards.userCardDataList.find(
		(userCard) => userCard.d_card_datas_id === dCardDatasId,
	);
	if (!card) return false;
	const maxStyleLevel = readNumber(
		card.max_style_level,
		'user card max_style_level',
	);
	const maxLimitBreakTimes = readNumber(
		card.max_limit_break_times,
		'user card max_limit_break_times',
	);
	if (
		styleLevel < 0 ||
		styleLevel > maxStyleLevel ||
		limitBreakTimes < 0 ||
		limitBreakTimes > maxLimitBreakTimes
	) {
		return false;
	}
	card.style_level = styleLevel;
	card.limit_break_times = limitBreakTimes;
	applyUserCardLimitBreakAvailability(card);
	return true;
}

export function updateUserCardSkillLevel(
	state: UserCardCollectionContainer,
	playerId: string,
	dCardDatasId: string,
	skillType: number,
	skillLevel: number,
): boolean {
	const cards = findUserCards(state, playerId);
	if (!cards) return false;
	const card = cards.userCardDataList.find(
		(userCard) => userCard.d_card_datas_id === dCardDatasId,
	);
	if (!card || !Array.isArray(card.skill_list)) return false;
	const skill = card.skill_list.find(
		(value) =>
			isRecord(value) &&
			value.skill_type === skillType &&
			typeof value.max_skill_level === 'number',
	);
	if (!isRecord(skill)) return false;
	const maxSkillLevel = readNumber(
		skill.max_skill_level,
		'user card max_skill_level',
	);
	if (skillLevel < 1 || skillLevel > maxSkillLevel) return false;
	skill.skill_level = skillLevel;
	return true;
}

export function updateUserCardEvolution(
	state: UserCardCollectionContainer,
	playerId: string,
	dCardDatasId: string,
	nextCard: UserCardTemplateState,
): boolean {
	const cards = findUserCards(state, playerId);
	if (!cards) return false;
	const cardIndex = cards.userCardDataList.findIndex(
		(userCard) => userCard.d_card_datas_id === dCardDatasId,
	);
	if (cardIndex < 0) return false;
	const currentCard = cards.userCardDataList[cardIndex];
	if (!currentCard) return false;
	const evolvedCard = {
		...createEvolvedUserCard(currentCard, nextCard),
		d_card_datas_id: dCardDatasId,
	};
	applyUserCardLimitBreakAvailability(evolvedCard);
	cards.userCardDataList[cardIndex] = evolvedCard;
	return true;
}

export function removeUserCard(
	state: UserCardCollectionContainer,
	playerId: string,
	dCardDatasId: string,
): boolean {
	const cards = findUserCards(state, playerId);
	if (!cards) return false;
	const nextCards = cards.userCardDataList.filter(
		(card) => card.d_card_datas_id !== dCardDatasId,
	);
	if (nextCards.length === cards.userCardDataList.length) return false;
	cards.userCardDataList = nextCards;
	return true;
}

function createEvolvedUserCard(
	currentCard: UserCardDataState,
	nextCard: UserCardTemplateState,
): UserCardDataState {
	const evolvedCard = structuredClone(nextCard);
	evolvedCard.style_level = readNumber(
		currentCard.style_level,
		'user card style_level',
	);
	evolvedCard.limit_break_times = readNumber(
		currentCard.limit_break_times,
		'user card limit_break_times',
	);
	evolvedCard.skill_list = preserveSkillLevels(
		readCardSkillList(currentCard),
		evolvedCard.skill_list,
		(skill) => skill.skill_type,
	);
	evolvedCard.rhythm_game_skill_list = preserveSkillLevels(
		readRhythmGameSkillList(currentCard),
		evolvedCard.rhythm_game_skill_list,
		(skill) => skill.rhythm_game_skill_type,
	);
	return evolvedCard;
}

function preserveSkillLevels<TSkill extends { skill_level: number }>(
	currentSkills: readonly TSkill[],
	nextSkills: readonly TSkill[],
	readSkillType: (skill: TSkill) => number,
): TSkill[] {
	const currentLevelByType = new Map<number, number>();
	for (const skill of currentSkills) {
		currentLevelByType.set(readSkillType(skill), skill.skill_level);
	}
	return nextSkills.map((skill) => {
		const skillLevel = currentLevelByType.get(readSkillType(skill));
		return skillLevel === undefined
			? structuredClone(skill)
			: { ...structuredClone(skill), skill_level: skillLevel };
	});
}

function readCardSkillList(card: UserCardDataState): UserCardSkillState[] {
	return Array.isArray(card.skill_list)
		? card.skill_list.filter(isUserCardSkillState)
		: [];
}

function readRhythmGameSkillList(
	card: UserCardDataState,
): UserRhythmGameSkillState[] {
	return Array.isArray(card.rhythm_game_skill_list)
		? card.rhythm_game_skill_list.filter(isUserRhythmGameSkillState)
		: [];
}

function isUserCardSkillState(value: unknown): value is UserCardSkillState {
	return (
		isRecord(value) &&
		typeof value.skill_type === 'number' &&
		typeof value.card_skill_series_id === 'number' &&
		typeof value.skill_level === 'number' &&
		typeof value.max_skill_level === 'number'
	);
}

function isUserRhythmGameSkillState(
	value: unknown,
): value is UserRhythmGameSkillState {
	return (
		isRecord(value) &&
		typeof value.rhythm_game_skill_type === 'number' &&
		typeof value.skill_level === 'number'
	);
}
