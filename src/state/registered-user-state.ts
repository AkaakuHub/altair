import { randomUUID } from 'node:crypto';
import type {
	RegisteredUserState,
	ServerState,
} from '../server-state-schema.ts';

export function createRegisteredUser(
	playerName: string,
	playerLevel: number,
	birthday: string,
): RegisteredUserState {
	const now = createUtcTimestamp();
	return {
		playerId: createPlayerId(),
		deviceSpecificId: randomUUID(),
		sessionToken: randomUUID(),
		playerName,
		birthday,
		entryTime: now,
		lastLoginDate: now,
		playerLevel,
	};
}

export function saveRegisteredUser(
	state: Pick<ServerState, 'registeredUsers'>,
	user: RegisteredUserState,
): void {
	state.registeredUsers = [
		...state.registeredUsers.filter(
			(registeredUser) => registeredUser.playerId !== user.playerId,
		),
		user,
	];
}

export function findRegisteredUser(
	state: Pick<ServerState, 'registeredUsers'>,
	playerId: string,
): RegisteredUserState | undefined {
	return state.registeredUsers.find((user) => user.playerId === playerId);
}

export function createUtcTimestamp(): string {
	return new Date().toISOString().replace('Z', '0000Z');
}

function createPlayerId(): string {
	const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	const bytes = randomUUID().replaceAll('-', '');
	let playerId = '';
	for (let index = 0; index < 9; index += 1) {
		const hexPair = bytes.slice(index * 2, index * 2 + 2);
		playerId += alphabet[Number.parseInt(hexPair, 16) % alphabet.length];
	}
	return playerId;
}
