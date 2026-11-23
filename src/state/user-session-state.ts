import type { ServerState } from '../server-state-schema.ts';
import type { EnsureStateResult } from './ensure-state-result.ts';
import { isArrayOf, isRecord } from './json-state-utils.ts';
import type { LoginBonusProgressState } from './login-bonus-types.ts';
import { isLoginBonusProgressState } from './login-bonus-validator.ts';

export type UserSessionState = {
	playerId: string;
	pushDeviceToken: string;
	isLoginBonusReceived: boolean;
	loginBonusProgresses: LoginBonusProgressState[];
};

export function ensureUserSession(
	state: Pick<ServerState, 'userSessions'>,
	playerId: string,
): EnsureStateResult<UserSessionState> {
	const existing = state.userSessions.find(
		(session) => session.playerId === playerId,
	);
	if (existing) {
		return { value: existing, created: false };
	}
	const session = createInitialUserSession(playerId);
	state.userSessions = [...state.userSessions, session];
	return { value: session, created: true };
}

function createInitialUserSession(playerId: string): UserSessionState {
	return {
		playerId,
		pushDeviceToken: '',
		isLoginBonusReceived: false,
		loginBonusProgresses: [],
	};
}

export function isUserSessionState(value: unknown): value is UserSessionState {
	return (
		isRecord(value) &&
		typeof value.playerId === 'string' &&
		typeof value.pushDeviceToken === 'string' &&
		typeof value.isLoginBonusReceived === 'boolean' &&
		isArrayOf(value.loginBonusProgresses, isLoginBonusProgressState)
	);
}
