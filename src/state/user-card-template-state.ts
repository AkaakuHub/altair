import {
	type EntityIdentityFingerprint,
	type EntityProvenance,
	isSameEntityIdentity,
} from './entity-provenance.ts';
import { isRecord, readNumber } from './json-state-utils.ts';
import {
	findUserCardIndexBySeries,
	readUserCardSeriesId,
	type UserCardCollectionState,
} from './user-card-aggregate-state.ts';
import { applyUserCardLimitBreakAvailability } from './user-card-training-state.ts';
import type {
	UserCardDataState,
	UserCardSkillState,
	UserCardTemplateState,
	UserRhythmGameSkillState,
} from './user-card-types.ts';

type UserCardFactory = () => UserCardDataState;

export function addUserCardFromTemplate(
	cards: UserCardCollectionState,
	template: UserCardTemplateState,
	provenance: EntityProvenance,
): boolean {
	return ensureUserCardFromTemplate(cards, template, provenance, () => {
		const card = structuredClone(template);
		card.source_master_release_id = provenance.sourceMasterReleaseId;
		card.identity_fingerprint = provenance.identityFingerprint;
		return card;
	});
}

export function canApplyUserCardProvenance(
	cards: UserCardCollectionState,
	template: UserCardTemplateState,
	provenance: EntityProvenance,
): boolean {
	const existingIndex = findUserCardIndexBySeries(
		cards,
		readUserCardSeriesId(template),
	);
	if (existingIndex < 0) return true;
	const existingCard = cards.userCardDataList[existingIndex];
	if (
		isRecord(existingCard) &&
		existingCard.card_datas_id !== template.card_datas_id
	) {
		return true;
	}
	return (
		isRecord(existingCard) &&
		isSameEntityIdentity(
			readStoredCardFingerprint(existingCard),
			provenance.identityFingerprint,
		)
	);
}

export function ensureMaxedUserCardFromTemplate(
	cards: UserCardCollectionState,
	template: UserCardTemplateState,
	maxRhythmGameSkillLevel: number,
	provenance: EntityProvenance,
): boolean {
	const card = createMaxedUserCard(template, maxRhythmGameSkillLevel);
	card.source_master_release_id = provenance.sourceMasterReleaseId;
	card.identity_fingerprint = provenance.identityFingerprint;
	return ensureUserCardFromTemplate(cards, template, provenance, () => card);
}

function ensureUserCardFromTemplate(
	cards: UserCardCollectionState,
	template: UserCardTemplateState,
	provenance: EntityProvenance | undefined,
	createCard: UserCardFactory,
): boolean {
	const cardSeriesId = readUserCardSeriesId(template);
	const card = createCard();
	const existingIndex = findUserCardIndexBySeries(cards, cardSeriesId);
	if (existingIndex < 0) {
		card.d_card_datas_id = crypto.randomUUID();
		cards.userCardDataList = [...cards.userCardDataList, card];
		return true;
	}
	const existingCard = cards.userCardDataList[existingIndex];
	if (!isRecord(existingCard)) {
		throw new Error('user card data list has invalid card');
	}
	assertUserCardTemplateIdentity(cards, template, provenance);
	card.d_card_datas_id = existingCard.d_card_datas_id;
	const nextCards = [...cards.userCardDataList];
	nextCards[existingIndex] = card;
	cards.userCardDataList = nextCards;
	return true;
}

export function assertUserCardTemplateIdentity(
	cards: UserCardCollectionState,
	template: UserCardTemplateState,
	provenance: EntityProvenance | undefined,
): void {
	if (provenance === undefined) return;
	const cardSeriesId = readUserCardSeriesId(template);
	const existingIndex = findUserCardIndexBySeries(cards, cardSeriesId);
	if (existingIndex < 0) return;
	const existingCard = cards.userCardDataList[existingIndex];
	if (!isRecord(existingCard)) {
		throw new Error('user card data list has invalid card');
	}
	if (existingCard.card_datas_id !== template.card_datas_id) {
		return;
	}
	if (
		!isSameEntityIdentity(
			readStoredCardFingerprint(existingCard),
			provenance.identityFingerprint,
		)
	) {
		throw new Error(`user card identity mismatch: ${cardSeriesId}`);
	}
}

function readStoredCardFingerprint(
	card: Record<string, unknown>,
): EntityIdentityFingerprint | undefined {
	const fingerprint = card.identity_fingerprint;
	if (
		isRecord(fingerprint) &&
		typeof fingerprint.domain === 'string' &&
		typeof fingerprint.value === 'string'
	) {
		return { domain: fingerprint.domain, value: fingerprint.value };
	}
	const cardDatasId = card.card_datas_id;
	const characterId = card.character_id;
	if (typeof cardDatasId !== 'number' || typeof characterId !== 'number') {
		return undefined;
	}
	return {
		domain: 'card',
		value: JSON.stringify([
			cardDatasId,
			Math.trunc(cardDatasId / 10),
			characterId,
			cardDatasId % 10,
		]),
	};
}

function createMaxedUserCard(
	template: UserCardTemplateState,
	maxRhythmGameSkillLevel: number,
): UserCardTemplateState {
	const card = structuredClone(template);
	const maxStyleLevel = readNumber(
		card.max_style_level,
		'user card max_style_level',
	);
	const maxLimitBreakTimes = readNumber(
		card.max_limit_break_times,
		'user card max_limit_break_times',
	);
	card.style_level = maxStyleLevel;
	card.limit_break_times = maxLimitBreakTimes;
	card.is_style_level_up = false;
	applyUserCardLimitBreakAvailability(card);
	card.skill_list = createMaxedSkillList(card.skill_list);
	card.rhythm_game_skill_list = createMaxedRhythmGameSkillList(
		card.rhythm_game_skill_list,
		maxRhythmGameSkillLevel,
	);
	return card;
}

function createMaxedSkillList(
	value: readonly UserCardSkillState[],
): UserCardSkillState[] {
	return mapSkillRecords(value, (skill) => {
		const maxSkillLevel = readNumber(
			skill.max_skill_level,
			'user card max_skill_level',
		);
		return {
			...structuredClone(skill),
			skill_level: maxSkillLevel,
		};
	});
}

function createMaxedRhythmGameSkillList(
	value: readonly UserRhythmGameSkillState[],
	maxRhythmGameSkillLevel: number,
): UserRhythmGameSkillState[] {
	const skillList = mapSkillRecords(value, (skill) => ({
		...structuredClone(skill),
		skill_level: maxRhythmGameSkillLevel,
	}));
	if (skillList.length > 0 && maxRhythmGameSkillLevel < 1) {
		throw new Error('user card rhythm game max skill level must be positive');
	}
	return skillList;
}

function mapSkillRecords<TSkill extends { skill_level: number }>(
	value: readonly TSkill[],
	mapSkill: (skill: TSkill) => TSkill,
): TSkill[] {
	return value.map((skill) => {
		return mapSkill(skill);
	});
}
