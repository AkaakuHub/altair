import type { ServerState } from '../../../../../../src/server-state-schema.ts';
import type { UserFriendCardState } from '../../../../../../src/state/friend-card-types.ts';
import {
	type JsonRecord,
	readNumber,
	readRecord,
	readRecordArray,
	readString,
} from '../official-data-migration-dump.ts';

export function createFriendCardFromFollowInfo(
	playerId: string,
	entry: JsonRecord,
): UserFriendCardState | null {
	let schoolIdolStageCardId = '';
	let rhythmGameCardId = '';
	for (const friendCardInfo of readRecordArray(entry.friend_card_info)) {
		const cardType = readNumber(friendCardInfo.card_type);
		const userCardInfo = readRecord(friendCardInfo.user_card_info);
		const cardId = readString(userCardInfo?.d_card_datas_id);
		if (cardId === null) continue;
		if (cardType === 1) schoolIdolStageCardId = cardId;
		if (cardType === 2) rhythmGameCardId = cardId;
	}
	return schoolIdolStageCardId.length === 0 && rhythmGameCardId.length === 0
		? null
		: { playerId, schoolIdolStageCardId, rhythmGameCardId };
}

export function upsertUserFriendCard(
	state: ServerState,
	friendCard: UserFriendCardState,
): void {
	const index = state.userFriendCards.findIndex(
		(current) => current.playerId === friendCard.playerId,
	);
	if (index === -1) state.userFriendCards.push(friendCard);
	else state.userFriendCards[index] = friendCard;
}
