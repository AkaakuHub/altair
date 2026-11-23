import type { CardMemberFanLevelState } from '../../state/card-member-fan-level-state.ts';
import { readNumber } from '../../state/json-state-utils.ts';
import type { UserCardCollectionState } from '../../state/user-card-aggregate-state.ts';
import type { UserCardDataState } from '../../state/user-card-types.ts';
import type {
	UserCardDataResponse,
	UserCardDetailResponse,
	UserCardsResponse,
} from '../response-types/user-card-deck-response-types.ts';

export function createUserCardsResponseWithMemberFanLevels(
	cards: UserCardCollectionState,
	memberFanLevels: CardMemberFanLevelState[],
): UserCardsResponse {
	return {
		user_card_data_list: createUserCardDataListWithMemberFanLevels(
			cards,
			memberFanLevels,
		),
	};
}

export function createUserCardDataListWithMemberFanLevels(
	cards: UserCardCollectionState,
	memberFanLevels: CardMemberFanLevelState[],
): UserCardDataResponse[] {
	const memberFanLevelByCharacterId =
		createMemberFanLevelByCharacterId(memberFanLevels);
	return cards.userCardDataList.map((card) =>
		createUserCardDataWithMemberFanLevel(card, memberFanLevelByCharacterId),
	);
}

export function createUserCardDetailResponseWithMemberFanLevels(
	cards: UserCardCollectionState,
	dCardDatasId: string,
	detailTemplate: UserCardDetailResponse | undefined,
	memberFanLevels: CardMemberFanLevelState[],
): UserCardDetailResponse | undefined {
	const response = createUserCardDetailResponse(
		cards,
		dCardDatasId,
		detailTemplate,
	);
	if (!response) {
		return undefined;
	}
	return {
		...response,
		user_card_data: createUserCardDataWithMemberFanLevel(
			response.user_card_data,
			createMemberFanLevelByCharacterId(memberFanLevels),
		),
	};
}

function createUserCardDetailResponse(
	cards: UserCardCollectionState,
	dCardDatasId: string,
	detailTemplate: UserCardDetailResponse | undefined,
): UserCardDetailResponse | undefined {
	const card = cards.userCardDataList.find(
		(userCard) => userCard.d_card_datas_id === dCardDatasId,
	);
	if (!card) {
		return undefined;
	}
	if (!detailTemplate) {
		return { user_card_data: createOfficialUserCardData(card) };
	}
	return {
		...structuredClone(detailTemplate),
		user_card_data: mergeUserCardData(detailTemplate.user_card_data, card),
	};
}

function createUserCardDataWithMemberFanLevel(
	card: UserCardDataState,
	memberFanLevelByCharacterId: ReadonlyMap<number, number>,
): UserCardDataResponse {
	const characterId = readNumber(card.character_id, 'user card character_id');
	const memberFanLevel = memberFanLevelByCharacterId.get(characterId);
	if (memberFanLevel === undefined) {
		throw new Error(`member fan level not found for character: ${characterId}`);
	}
	return {
		...createOfficialUserCardData(card),
		member_fan_level: memberFanLevel,
	};
}

function createMemberFanLevelByCharacterId(
	memberFanLevels: CardMemberFanLevelState[],
): ReadonlyMap<number, number> {
	const memberFanLevelByCharacterId = new Map<number, number>();
	for (const level of memberFanLevels) {
		if (!memberFanLevelByCharacterId.has(level.characterId)) {
			memberFanLevelByCharacterId.set(level.characterId, level.memberFanLevel);
		}
	}
	return memberFanLevelByCharacterId;
}

function mergeUserCardData(
	templateCard: UserCardDataState,
	card: UserCardDataState,
): UserCardDataResponse {
	return createOfficialUserCardData({
		...structuredClone(templateCard),
		...structuredClone(card),
	});
}

export function createOfficialUserCardData(
	card: UserCardDataState,
): UserCardDataResponse {
	const response = structuredClone(card);
	delete response.source_master_release_id;
	delete response.identity_fingerprint;
	return response;
}
