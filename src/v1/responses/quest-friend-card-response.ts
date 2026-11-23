import { isFriendCardVisible } from '../../application/friend-card-projection.ts';
import type { UserOwnedMasterSupport } from '../../application/user-owned-master-projection.ts';
import type { UserStatusController } from '../../application/user-status-controller.ts';
import type {
	RegisteredUserState,
	ServerState,
} from '../../server-state-schema.ts';
import { calculateFanLevel } from '../../state/fan-level-calculation.ts';
import type { UserFriendCardState } from '../../state/friend-card-types.ts';
import {
	findUserCard,
	findUserCards,
} from '../../state/user-card-aggregate-state.ts';
import { hasMutedPlayer } from '../../state/user-social-aggregate.ts';
import type { QuestLiveFriendCardResponse } from '../response-types/follow-response-types.ts';
import { createProfileIconPartsInfo } from './profile-icon-parts-response.ts';
import { createOfficialUserCardData } from './user-card-response.ts';

type FriendCardSlot = 'schoolIdolStage' | 'rhythmGame';

type QuestLiveFriendCardListSource = Pick<
	ServerState,
	| 'followRelations'
	| 'registeredUsers'
	| 'userCards'
	| 'userFriendCards'
	| 'userProfileDesigns'
	| 'userSocials'
	| 'userStatuses'
> & {
	requestPlayerId: string;
	friendCardSlot: FriendCardSlot;
};

export function createQuestLiveFriendCardList(
	source: QuestLiveFriendCardListSource,
	userStatus: UserStatusController,
	masterSupport: Pick<UserOwnedMasterSupport, 'getCardFingerprint' | 'hasCard'>,
): QuestLiveFriendCardResponse[] {
	const requestUser = findUser(source, source.requestPlayerId);
	if (!requestUser) {
		throw new Error(
			`quest live friend card source user not found: ${source.requestPlayerId}`,
		);
	}
	return source.followRelations
		.filter((relation) => relation.playerId === requestUser.playerId)
		.filter(
			(relation) =>
				!hasMutedPlayer(source, requestUser.playerId, relation.targetPlayerId),
		)
		.map((relation) => findRequiredUser(source, relation.targetPlayerId))
		.map((user) =>
			createQuestLiveFriendCard(
				source,
				user,
				source.friendCardSlot,
				userStatus,
				masterSupport,
			),
		)
		.filter((entry) => entry !== undefined);
}

function createQuestLiveFriendCard(
	state: Pick<
		ServerState,
		'userCards' | 'userFriendCards' | 'userProfileDesigns' | 'userStatuses'
	>,
	user: RegisteredUserState,
	friendCardSlot: FriendCardSlot,
	userStatus: UserStatusController,
	masterSupport: Pick<UserOwnedMasterSupport, 'getCardFingerprint' | 'hasCard'>,
): QuestLiveFriendCardResponse | undefined {
	const cards = findUserCards(state, user.playerId);
	if (!cards) return undefined;
	const friendCard = state.userFriendCards.find(
		(value) => value.playerId === user.playerId,
	);
	const card =
		friendCard === undefined
			? undefined
			: findUserCard(cards, friendCardId(friendCard, friendCardSlot));
	if (!card || !isFriendCardVisible(card, masterSupport)) return undefined;
	const status = userStatus.ensure(state, user.playerId).value;
	return {
		player_id: user.playerId,
		name: user.playerName,
		fan_level: calculateFanLevel(userStatus.getMemberFanLevels(status)),
		profile_icon_parts_info: createProfileIconPartsInfo(state, user.playerId),
		friend_status: 2,
		friend_card_info: createOfficialUserCardData(card),
	};
}

function friendCardId(
	friendCard: UserFriendCardState,
	friendCardSlot: FriendCardSlot,
): string {
	return friendCardSlot === 'schoolIdolStage'
		? friendCard.schoolIdolStageCardId
		: friendCard.rhythmGameCardId;
}

function findRequiredUser(
	state: Pick<ServerState, 'registeredUsers'>,
	playerId: string,
): RegisteredUserState {
	const user = findUser(state, playerId);
	if (!user) throw new Error(`registered user not found: ${playerId}`);
	return user;
}

function findUser(
	state: Pick<ServerState, 'registeredUsers'>,
	playerId: string,
): RegisteredUserState | undefined {
	return state.registeredUsers.find((user) => user.playerId === playerId);
}
