import type {
	AdminAccountLink,
	AdminRegisteredUser,
} from '@altair/runtime/admin/dto/admin-visible-state-schema.ts';
import type { AdminFormValues } from '../../../form-value.ts';
import { findPlayerState } from '../player-state.ts';

export type AccountLinkForm = {
	playerId: string;
	provider: string;
	platformType: string;
	idToken: string;
};

export type NewUserForm = {
	playerName: string;
	playerLevel: string;
	birthday: string;
};
export type EditingUserForm = Pick<
	AdminRegisteredUser,
	'playerId' | 'playerName' | 'birthday' | 'deviceSpecificId' | 'sessionToken'
> & { playerLevel: string };

export function createEditingUserForm(
	user: AdminRegisteredUser,
): EditingUserForm {
	return {
		playerId: user.playerId,
		playerName: user.playerName,
		playerLevel: String(user.playerLevel),
		birthday: user.birthday,
		deviceSpecificId: user.deviceSpecificId,
		sessionToken: user.sessionToken,
	};
}

export const unsetBirthday = '0001-01-01T00:00:00Z';

export function createNewUserForm(): NewUserForm {
	return { playerName: '', playerLevel: '1', birthday: unsetBirthday };
}

export function newUserFormValues(form: NewUserForm): AdminFormValues {
	return {
		playerName: form.playerName,
		playerLevel: Number(form.playerLevel),
		birthday: form.birthday,
	};
}

export function editingUserFormValues(
	currentPlayerId: string,
	user: EditingUserForm,
): AdminFormValues {
	return {
		currentPlayerId,
		playerId: user.playerId,
		playerName: user.playerName,
		playerLevel: Number(user.playerLevel),
		birthday: user.birthday,
		deviceSpecificId: user.deviceSpecificId,
		sessionToken: user.sessionToken,
	};
}

export function accountLinkFormValues(form: AccountLinkForm): AdminFormValues {
	return {
		playerId: form.playerId,
		provider: Number(form.provider),
		platformType: Number(form.platformType),
		idToken: form.idToken,
	};
}

export function createAccountLinkForm(
	user: AdminRegisteredUser | undefined,
	accountLinks: AdminAccountLink[],
): AccountLinkForm {
	const existing =
		user === undefined
			? undefined
			: findPlayerState(accountLinks, user.playerId);
	return {
		playerId: user?.playerId ?? '',
		provider: String(existing?.provider ?? 1),
		platformType: String(existing?.platformType ?? user?.platformType ?? 1),
		idToken: existing?.idToken ?? '',
	};
}

export function filterRegisteredUsers(
	users: AdminRegisteredUser[],
	query: string,
): AdminRegisteredUser[] {
	const normalized = query.trim().toLowerCase();
	if (normalized.length === 0) {
		return users;
	}
	return users.filter((user) =>
		`${user.playerId} ${user.playerName} ${user.playerLevel} ${user.birthday} ${user.deviceSpecificId} ${user.lastLoginDate}`
			.toLowerCase()
			.includes(normalized),
	);
}
