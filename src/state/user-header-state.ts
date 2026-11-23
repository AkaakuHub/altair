import type {
	RegisteredUserState,
	ServerState,
} from '../server-state-schema.ts';
import { isRecord } from './json-state-utils.ts';

export type UserHeaderState = {
	playerId: string;
	isAlreadyReadFriendRequest: boolean;
	isAlreadyReadPetalExchangeNewArrival: boolean;
	isAlreadyReadShopNewArrival: boolean;
	isAlreadyReadSiscaShopNewArrival: boolean;
};

export function ensureUserHeaderStates(state: ServerState): void {
	state.userHeaders ??= [];
	state.userHeaders = state.userHeaders.map(normalizeUserHeaderState);
	for (const user of state.registeredUsers) {
		ensureUserHeaderState(state, user.playerId);
	}
}

export function ensureUserHeaderState(
	state: { userHeaders: UserHeaderState[] },
	playerId: string,
): UserHeaderState {
	const existing = state.userHeaders.find(
		(header) => header.playerId === playerId,
	);
	if (existing) {
		return existing;
	}
	const header = createDefaultUserHeaderState(playerId);
	state.userHeaders = [...state.userHeaders, header];
	return header;
}

export function getUserHeaderState(
	state: { userHeaders: UserHeaderState[] },
	user: RegisteredUserState | undefined,
): UserHeaderState {
	if (user === undefined) {
		return createDefaultUserHeaderState('');
	}
	const header = state.userHeaders.find(
		(userHeader) => userHeader.playerId === user.playerId,
	);
	if (header === undefined) {
		throw new Error(`Missing user header state: ${user.playerId}`);
	}
	return header;
}

export function markFriendRequestUnread(
	state: { userHeaders: UserHeaderState[] },
	playerId: string,
): boolean {
	const header = ensureUserHeaderState(state, playerId);
	if (!header.isAlreadyReadFriendRequest) {
		return false;
	}
	header.isAlreadyReadFriendRequest = false;
	return true;
}

export function markFriendRequestRead(
	state: { userHeaders: UserHeaderState[] },
	playerId: string,
): boolean {
	const header = ensureUserHeaderState(state, playerId);
	if (header.isAlreadyReadFriendRequest) {
		return false;
	}
	header.isAlreadyReadFriendRequest = true;
	return true;
}

export function markPetalExchangeNewArrivalRead(
	state: { userHeaders: UserHeaderState[] },
	playerId: string,
): boolean {
	const header = ensureUserHeaderState(state, playerId);
	if (header.isAlreadyReadPetalExchangeNewArrival) {
		return false;
	}
	header.isAlreadyReadPetalExchangeNewArrival = true;
	return true;
}

export function markShopNewArrivalRead(
	state: { userHeaders: UserHeaderState[] },
	playerId: string,
): boolean {
	const header = ensureUserHeaderState(state, playerId);
	if (header.isAlreadyReadShopNewArrival) {
		return false;
	}
	header.isAlreadyReadShopNewArrival = true;
	return true;
}

export function markSiscaShopNewArrivalRead(
	state: { userHeaders: UserHeaderState[] },
	playerId: string,
): boolean {
	const header = ensureUserHeaderState(state, playerId);
	if (header.isAlreadyReadSiscaShopNewArrival) {
		return false;
	}
	header.isAlreadyReadSiscaShopNewArrival = true;
	return true;
}

export function isUserHeaderState(value: unknown): value is UserHeaderState {
	return (
		isRecord(value) &&
		typeof value.playerId === 'string' &&
		typeof value.isAlreadyReadFriendRequest === 'boolean' &&
		typeof value.isAlreadyReadPetalExchangeNewArrival === 'boolean' &&
		typeof value.isAlreadyReadShopNewArrival === 'boolean' &&
		typeof value.isAlreadyReadSiscaShopNewArrival === 'boolean'
	);
}

function createDefaultUserHeaderState(playerId: string): UserHeaderState {
	return {
		playerId,
		isAlreadyReadFriendRequest: false,
		isAlreadyReadPetalExchangeNewArrival: false,
		isAlreadyReadShopNewArrival: false,
		isAlreadyReadSiscaShopNewArrival: false,
	};
}

function normalizeUserHeaderState(header: UserHeaderState): UserHeaderState {
	return {
		playerId: header.playerId,
		isAlreadyReadFriendRequest: header.isAlreadyReadFriendRequest,
		isAlreadyReadPetalExchangeNewArrival:
			header.isAlreadyReadPetalExchangeNewArrival,
		isAlreadyReadShopNewArrival: header.isAlreadyReadShopNewArrival,
		isAlreadyReadSiscaShopNewArrival: header.isAlreadyReadSiscaShopNewArrival,
	};
}
