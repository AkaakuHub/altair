import type {
	RegisteredUserState,
	ServerState,
} from '../server-state-schema.ts';
import type { UserStatusAccess } from './user-status-port.ts';
import type { UserStatusState } from './user-status-types.ts';

const PAID_SISCA_ITEM_ID = 1001001;
const FREE_SISCA_ITEM_ID = 1002001;

export function isSiscaItemId(itemId: number): boolean {
	return itemId === PAID_SISCA_ITEM_ID || itemId === FREE_SISCA_ITEM_ID;
}

export function isPaidSiscaItemId(itemId: number): boolean {
	return itemId === PAID_SISCA_ITEM_ID;
}

export function isFreeSiscaItemId(itemId: number): boolean {
	return itemId === FREE_SISCA_ITEM_ID;
}

export function addFreeSisca(
	state: ServerState,
	playerId: string,
	amount: number,
	userStatus: UserStatusAccess,
): void {
	userStatus.ensure(state, playerId).value.jewelFree += amount;
}

export function addPaidSisca(
	state: ServerState,
	user: RegisteredUserState,
	amount: number,
	userStatus: UserStatusAccess,
): void {
	const status = userStatus.ensure(state, user.playerId).value;
	if (user.platformType === 2) {
		status.jewelPaidApple += amount;
		return;
	}
	status.jewelPaidGoogle += amount;
}

export type SiscaBalance = {
	free: number;
	paid: number;
};

export function consumeSisca(
	state: ServerState,
	user: RegisteredUserState,
	amount: number,
	isPaidOnly: boolean,
	userStatus: UserStatusAccess,
): SiscaBalance | undefined {
	if (amount <= 0) {
		return undefined;
	}
	const status = userStatus.ensure(state, user.playerId).value;
	if (isPaidOnly) {
		if (getPlatformPaidSisca(status, user) < amount) {
			return undefined;
		}
		addPlatformPaidSisca(status, user, -amount);
		return createSiscaBalance(status, user);
	}
	if (status.jewelFree >= amount) {
		status.jewelFree -= amount;
		return createSiscaBalance(status, user);
	}
	const remainingAmount = amount - status.jewelFree;
	if (getPlatformPaidSisca(status, user) < remainingAmount) {
		return undefined;
	}
	status.jewelFree = 0;
	addPlatformPaidSisca(status, user, -remainingAmount);
	return createSiscaBalance(status, user);
}

export function canConsumeSisca(
	state: ServerState,
	user: RegisteredUserState,
	amount: number,
	isPaidOnly: boolean,
	userStatus: UserStatusAccess,
): boolean {
	if (amount <= 0) {
		return false;
	}
	const status = userStatus.ensure(state, user.playerId).value;
	if (isPaidOnly) {
		return getPlatformPaidSisca(status, user) >= amount;
	}
	return status.jewelFree + getPlatformPaidSisca(status, user) >= amount;
}

export function createSiscaBalanceForUser(
	state: ServerState,
	user: RegisteredUserState,
	userStatus: UserStatusAccess,
): SiscaBalance {
	return createSiscaBalance(
		userStatus.ensure(state, user.playerId).value,
		user,
	);
}

function createSiscaBalance(
	status: UserStatusState,
	user: RegisteredUserState,
): SiscaBalance {
	return {
		free: status.jewelFree,
		paid: getPlatformPaidSisca(status, user),
	};
}

function getPlatformPaidSisca(
	status: UserStatusState,
	user: RegisteredUserState,
): number {
	return user.platformType === 2
		? status.jewelPaidApple
		: status.jewelPaidGoogle;
}

function addPlatformPaidSisca(
	status: UserStatusState,
	user: RegisteredUserState,
	amount: number,
): void {
	if (user.platformType === 2) {
		status.jewelPaidApple += amount;
		return;
	}
	status.jewelPaidGoogle += amount;
}
