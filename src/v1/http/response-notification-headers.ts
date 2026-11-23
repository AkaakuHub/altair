import type {
	RegisteredUserState,
	ServerState,
} from '../../server-state-schema.ts';
import { getLatestCircleChatOrderId } from '../../state/circle-chat-state.ts';
import {
	hasPendingCircleJoinRequestForLeader,
	hasPendingCircleJoinRequestFromPlayer,
} from '../../state/circle-join-state.ts';
import { hasCircleDissolutionNotification } from '../../state/circle-notification-state.ts';
import { getAchievedMissionNotificationList } from '../../state/rhythm-game-class-mission-notification-state.ts';
import type { UserHeaderState } from '../../state/user-header-state.ts';
import { hasCircleInviteListItems } from '../responses/circle-membership-response.ts';
import {
	hasItemStoreProducts,
	hasMembershipProducts,
} from '../responses/item-store-response.ts';
import type { ResponseHeaderContext } from './response-header-context.ts';

export function renderNotificationHeaderValue(
	name: string,
	state: ServerState,
	user: RegisteredUserState | undefined,
	userHeader: UserHeaderState,
	context: ResponseHeaderContext,
): string | undefined {
	const playerId = user?.playerId ?? '';
	switch (name) {
		case 'achieved_mission_notification_list':
			return JSON.stringify(
				getAchievedMissionNotificationList(state, user, {
					getReceivableIds: context.getReceivableRhythmGameClassDataIds,
					projectScores: context.projectRhythmMusicScores,
				}),
			);
		case 'exists_circle_approval_pending_from_user':
			return String(
				hasPendingCircleJoinRequestFromPlayer(state.circle, playerId),
			);
		case 'is_already_read_friend_request':
			return String(
				notificationReadState(
					hasFollowerNotification(state, playerId),
					userHeader.isAlreadyReadFriendRequest,
				),
			);
		case 'is_already_read_item_store_new_arrival':
			return String(!hasItemStoreProducts());
		case 'is_already_read_membership_new_arrival':
			return String(!hasMembershipProducts());
		case 'is_already_read_petal_exchange_new_arrival':
			return String(
				notificationReadState(
					context.hasAvailablePetalExchange(state, user),
					userHeader.isAlreadyReadPetalExchangeNewArrival,
				),
			);
		case 'is_already_read_shop_new_arrival':
			return String(
				notificationReadState(
					context.hasAvailableShopExchange(state, user),
					userHeader.isAlreadyReadShopNewArrival,
				),
			);
		case 'is_already_read_sisca_shop_new_arrival':
			return String(
				notificationReadState(
					context.hasAvailableSiscaStorePurchase(state, user),
					userHeader.isAlreadyReadSiscaShopNewArrival,
				),
			);
		case 'is_circle_approve_user':
			return String(
				hasPendingCircleJoinRequestForLeader(state.circle, playerId),
			);
		case 'is_circle_dissolution_user':
			return String(hasCircleDissolutionNotification(state, playerId));
		case 'is_circle_invite_user':
			return String(hasCircleInviteListItems());
		case 'latest_chat_order_id':
			return String(getLatestCircleChatOrderId(state.circle));
		default:
			return undefined;
	}
}

export function notificationReadState(
	hasNotificationTarget: boolean,
	isAlreadyRead: boolean,
): boolean {
	return !hasNotificationTarget || isAlreadyRead;
}

function hasFollowerNotification(
	state: ServerState,
	playerId: string,
): boolean {
	return state.followRelations.some(
		(relation) => relation.targetPlayerId === playerId,
	);
}
