import type {
	RegisteredUserState,
	ServerState,
} from '../../server-state-schema.ts';

const usersBySessionTokenCache = new WeakMap<
	RegisteredUserState[],
	ReadonlyMap<string, RegisteredUserState>
>();

export function resolveRequestUser(
	headers: Headers,
	state: Pick<ServerState, 'registeredUsers'>,
): RegisteredUserState | undefined {
	const token = bearerToken(headers.get('authorization'));
	if (token === undefined) {
		return undefined;
	}
	return getUsersBySessionToken(state.registeredUsers).get(token);
}

function getUsersBySessionToken(
	registeredUsers: RegisteredUserState[],
): ReadonlyMap<string, RegisteredUserState> {
	const cached = usersBySessionTokenCache.get(registeredUsers);
	if (cached) {
		return cached;
	}
	const usersBySessionToken = new Map<string, RegisteredUserState>();
	for (const user of registeredUsers) {
		if (!usersBySessionToken.has(user.sessionToken)) {
			usersBySessionToken.set(user.sessionToken, user);
		}
	}
	usersBySessionTokenCache.set(registeredUsers, usersBySessionToken);
	return usersBySessionToken;
}

function bearerToken(value: string | null): string | undefined {
	if (value === null) {
		return undefined;
	}
	const [scheme, token] = value.split(' ');
	if (scheme !== 'Bearer' || token === undefined || token.length === 0) {
		return undefined;
	}
	return token;
}
