import { isRecord, readNumber } from './json-state-utils.ts';
import {
	readUserCardSeriesId,
	type UserCardCollectionState,
} from './user-card-aggregate-state.ts';
import { applyUserCardLimitBreakAvailability } from './user-card-training-state.ts';
import type {
	UserCardDataState,
	UserCardTemplateState,
} from './user-card-types.ts';
import { isUserCardDataState } from './user-card-validator.ts';

export function createUserCardsFromSeed(
	playerId: string,
	seed: unknown,
): UserCardCollectionState {
	return {
		playerId,
		userCardDataList: readSeedUserCards(seed),
	};
}

export function repairUserCardsToValidState(
	cards: UserCardCollectionState,
	cardTemplates: UserCardTemplateState[],
): boolean {
	const canonicalTemplateBySeriesId =
		collectCanonicalTemplateBySeriesId(cardTemplates);
	const nextCards: UserCardDataState[] = [];
	const indexBySeriesId = new Map<number, number>();
	let changed = false;
	for (const sourceCard of cards.userCardDataList) {
		const cardDatasId = readNumber(
			sourceCard.card_datas_id,
			'user card card_datas_id',
		);
		const seriesId = readUserCardSeriesId(sourceCard);
		const canonicalTemplate = canonicalTemplateBySeriesId.get(seriesId);
		const card = canonicalTemplate
			? {
					...cloneUserCardData(canonicalTemplate),
					d_card_datas_id: sourceCard.d_card_datas_id,
				}
			: cloneUserCardData(sourceCard);
		if (canonicalTemplate && canonicalTemplate.card_datas_id !== cardDatasId) {
			changed = true;
		}
		const existingIndex = indexBySeriesId.get(seriesId);
		if (existingIndex === undefined) {
			indexBySeriesId.set(seriesId, nextCards.length);
			nextCards.push(card);
			continue;
		}
		const existingCard = nextCards[existingIndex];
		if (existingCard === undefined) {
			throw new Error(`missing valid user card: ${seriesId}`);
		}
		nextCards[existingIndex] = mergeDuplicateUserCard(existingCard, card);
		changed = true;
	}
	cards.userCardDataList = nextCards;
	return changed;
}

function readSeedUserCards(seed: unknown): UserCardDataState[] {
	if (!isRecord(seed) || !Array.isArray(seed.user_card_data_list)) {
		throw new Error('user_card_get_list seed must have user_card_data_list');
	}
	return seed.user_card_data_list.map((card) => {
		if (!isUserCardDataState(card)) {
			throw new Error('user_card_get_list seed has invalid card');
		}
		return cloneUserCardData(card);
	});
}

function mergeDuplicateUserCard(
	current: UserCardDataState,
	next: UserCardDataState,
): UserCardDataState {
	const merged = cloneUserCardData(current);
	merged.style_level = Math.max(
		readNumber(current.style_level, 'user card style_level'),
		readNumber(next.style_level, 'user card style_level'),
	);
	merged.limit_break_times = Math.max(
		readNumber(current.limit_break_times, 'user card limit_break_times'),
		readNumber(next.limit_break_times, 'user card limit_break_times'),
	);
	applyUserCardLimitBreakAvailability(merged);
	return merged;
}

function collectCanonicalTemplateBySeriesId(
	cardTemplates: UserCardTemplateState[],
): Map<number, UserCardDataState> {
	const templates = new Map<number, UserCardDataState>();
	for (const template of cardTemplates) {
		const cardDatasId = readNumber(template.card_datas_id, 'card_datas_id');
		const seriesId = readUserCardSeriesId(template);
		const existing = templates.get(seriesId);
		if (
			!existing ||
			cardDatasId >
				readNumber(existing.card_datas_id, 'user card template card_datas_id')
		) {
			templates.set(seriesId, template);
		}
	}
	return templates;
}

function cloneUserCardData<TCard extends UserCardDataState>(
	card: TCard,
): TCard {
	return structuredClone(card);
}
