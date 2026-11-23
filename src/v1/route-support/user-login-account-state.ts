import { randomUUID } from 'node:crypto';
import type {
	AccountLinkState,
	RegisteredUserState,
	ServerState,
} from '../../server-state-schema.ts';
import { isRecord } from '../../state/json-state-utils.ts';
import { removePlayerScopedState } from '../../state/player-scoped-state-lifecycle.ts';
import {
	createUtcTimestamp,
	saveRegisteredUser,
} from '../../state/registered-user-state.ts';
import type { UserSessionState } from '../../state/user-session-state.ts';
import {
	createTutorialStatusList,
	type UserTutorialState,
} from '../../state/user-tutorial-state.ts';
import type { UserLoginResponse } from '../response-types/account-response-types.ts';
import {
	itemStoreProductIds,
	membershipProductIds,
	siscaProductIds,
} from './user-login-product-catalog.ts';

export const UNSET_BIRTHDAY = '0001-01-01T00:00:00Z';

export function hasPlayerId(body: unknown): boolean {
	return (
		isRecord(body) &&
		typeof body.player_id === 'string' &&
		body.player_id.length > 0
	);
}

export function createExistingUserLoginResponse(
	user: RegisteredUserState,
	session: UserSessionState,
	tutorial: UserTutorialState,
): UserLoginResponse {
	return {
		is_login_bonus_receive: session.isLoginBonusReceived,
		is_term_update: false,
		is_tutorial: false,
		item_store_product_id_list: [...itemStoreProductIds],
		membership_product_id_list: [...membershipProductIds],
		push_device_token: session.pushDeviceToken,
		session_token: user.sessionToken,
		sisca_product_id_list: [...siscaProductIds],
		tutorials_status_list: createTutorialStatusList(tutorial),
		type: 2,
	};
}

export function createNewUserLoginResponse(): UserLoginResponse {
	return {
		is_login_bonus_receive: false,
		is_term_update: true,
		is_tutorial: true,
		item_store_product_id_list: [...itemStoreProductIds],
		membership_product_id_list: [...membershipProductIds],
		push_device_token: '',
		session_token: '',
		sisca_product_id_list: [...siscaProductIds],
		tutorials_status_list: [],
		type: 0,
	};
}

export function updateUserLoginState(
	state: ServerState,
	user: RegisteredUserState,
	deviceSpecificId: string,
	platformType = user.platformType,
): RegisteredUserState {
	const loggedInUser: RegisteredUserState = {
		...user,
		deviceSpecificId:
			deviceSpecificId.length > 0 ? deviceSpecificId : user.deviceSpecificId,
		sessionToken: randomUUID(),
		lastLoginDate: createUtcTimestamp(),
	};
	if (platformType !== undefined) {
		loggedInUser.platformType = platformType;
	}
	saveRegisteredUser(state, loggedInUser);
	return loggedInUser;
}

export function saveAccountLink(
	state: ServerState,
	accountLink: AccountLinkState,
): void {
	state.accountLinks = [
		...state.accountLinks.filter(
			(link) =>
				!(
					link.provider === accountLink.provider &&
					link.playerId === accountLink.playerId &&
					link.idToken === accountLink.idToken
				),
		),
		accountLink,
	];
}

export function findAccountLink(
	state: ServerState,
	provider: number,
	playerId: string,
	idToken: string,
): AccountLinkState | undefined {
	return state.accountLinks.find(
		(link) =>
			link.provider === provider &&
			link.playerId === playerId &&
			link.idToken === idToken,
	);
}

export function deleteRegisteredUser(
	state: ServerState,
	playerId: string,
): void {
	removePlayerScopedState(state, playerId);
	if (state.selectedAdminPlayerId === playerId) {
		state.selectedAdminPlayerId = null;
	}
}
