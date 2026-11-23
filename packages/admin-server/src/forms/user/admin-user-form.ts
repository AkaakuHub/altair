import type {
	AccountLinkState,
	RegisteredUserState,
	ServerState,
} from '../../../../../src/server-state-schema.ts';
import { addFollowRelation } from '../../../../../src/state/follow-state.ts';
import { renamePlayerScopedState } from '../../../../../src/state/player-scoped-state-lifecycle.ts';
import {
	createRegisteredUser,
	saveRegisteredUser,
} from '../../../../../src/state/registered-user-state.ts';
import { ensureUserHeaderState } from '../../../../../src/state/user-header-state.ts';
import {
	findAdminEntryByKey,
	hasAdminEntryByKey,
	replaceAdminEntryByKey,
} from '../../state/domain/admin-state-writer.ts';
import {
	type AdminForm,
	getAdminBoundedInteger,
	getFormString,
} from '../shared/admin-form-values.ts';

export function addFollowRelationFromForm(
	form: AdminForm,
	state: ServerState,
): boolean {
	const playerId = getFormString(form, 'playerId');
	const targetPlayerId = getFormString(form, 'targetPlayerId');
	return addFollowRelation(
		{
			followRelations: state.followRelations,
			registeredUsers: state.registeredUsers,
		},
		playerId,
		targetPlayerId,
	);
}

export function setSelectedAdminUserFromForm(
	form: AdminForm,
	state: ServerState,
): boolean {
	const playerId = getFormString(form, 'playerId');
	const user = findAdminEntryByKey(
		state.registeredUsers,
		playerId,
		(registeredUser) => registeredUser.playerId,
	);
	if (!user) {
		return false;
	}
	state.selectedAdminPlayerId = user.playerId;
	return true;
}

export function addRegisteredUserFromForm(
	form: AdminForm,
	state: ServerState,
	userStatus: UserStatusController,
): boolean {
	const playerName = getFormString(form, 'playerName').trim();
	const playerLevel = getAdminBoundedInteger(form, 'playerLevel', 1, 9999);
	const birthday = getFormString(form, 'birthday').trim();
	if (
		playerName.length === 0 ||
		playerLevel === undefined ||
		birthday.length === 0
	) {
		return false;
	}
	const user = createRegisteredUser(playerName, playerLevel, birthday);
	saveRegisteredUser(state, user);
	ensureUserHeaderState(state, user.playerId);
	userStatus.ensure(state, user.playerId);
	return true;
}

export function updateRegisteredUserFromForm(
	form: AdminForm,
	state: ServerState,
): boolean {
	const currentPlayerId = getFormString(form, 'currentPlayerId');
	const nextPlayerId = getFormString(form, 'playerId').trim();
	const playerName = getFormString(form, 'playerName').trim();
	const playerLevel = getAdminBoundedInteger(form, 'playerLevel', 1, 9999);
	const birthday = getFormString(form, 'birthday').trim();
	const deviceSpecificId = getFormString(form, 'deviceSpecificId').trim();
	const sessionToken = getFormString(form, 'sessionToken').trim();
	if (
		currentPlayerId.length === 0 ||
		nextPlayerId.length === 0 ||
		playerName.length === 0 ||
		playerLevel === undefined ||
		birthday.length === 0 ||
		deviceSpecificId.length === 0 ||
		sessionToken.length === 0
	) {
		return false;
	}
	const user = findAdminEntryByKey(
		state.registeredUsers,
		currentPlayerId,
		(registeredUser) => registeredUser.playerId,
	);
	if (!user || hasDifferentUser(state, currentPlayerId, nextPlayerId)) {
		return false;
	}
	const nextUser: RegisteredUserState = {
		...user,
		playerId: nextPlayerId,
		playerName,
		birthday,
		playerLevel,
		deviceSpecificId,
		sessionToken,
	};
	if (currentPlayerId !== nextPlayerId) {
		renamePlayerId(state, currentPlayerId, nextPlayerId);
	}
	state.registeredUsers = replaceAdminEntryByKey(
		state.registeredUsers,
		nextUser,
		(registeredUser) => registeredUser.playerId,
	);
	if (state.selectedAdminPlayerId === currentPlayerId) {
		state.selectedAdminPlayerId = nextPlayerId;
	}
	return true;
}

export function updateAccountLinkFromForm(
	form: AdminForm,
	state: ServerState,
): boolean {
	const playerId = getFormString(form, 'playerId');
	const provider = getAdminBoundedInteger(form, 'provider', 1, 1);
	const platformType = getAdminBoundedInteger(form, 'platformType', 1, 9);
	const idToken = getFormString(form, 'idToken');
	if (
		playerId.length === 0 ||
		provider === undefined ||
		platformType === undefined ||
		idToken.length === 0 ||
		!hasAdminEntryByKey(
			state.registeredUsers,
			playerId,
			(user) => user.playerId,
		)
	) {
		return false;
	}
	saveAdminAccountLink(state, { provider, playerId, idToken, platformType });
	return true;
}

function saveAdminAccountLink(
	state: ServerState,
	accountLink: AccountLinkState,
): void {
	state.accountLinks = replaceAdminEntryByKey(
		state.accountLinks,
		accountLink,
		(link) => link.playerId,
	);
}

function hasDifferentUser(
	state: ServerState,
	currentPlayerId: string,
	nextPlayerId: string,
): boolean {
	const user = findAdminEntryByKey(
		state.registeredUsers,
		nextPlayerId,
		(registeredUser) => registeredUser.playerId,
	);
	return user !== undefined && user.playerId !== currentPlayerId;
}

function renamePlayerId(
	state: ServerState,
	currentPlayerId: string,
	nextPlayerId: string,
): void {
	renamePlayerScopedState(state, currentPlayerId, nextPlayerId);
}

import type { UserStatusController } from '../../../../../src/application/user-status-controller.ts';
