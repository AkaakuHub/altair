import type { ServerState } from '../server-state-schema.ts';

interface PlayerOwnedEntry {
	playerId: string;
}

type PlayerOwnedStateKey = Exclude<
	Extract<
		{
			[K in keyof ServerState]: ServerState[K] extends PlayerOwnedEntry[]
				? K
				: never;
		}[keyof ServerState],
		keyof ServerState
	>,
	'followRelations'
>;

const playerOwnedStateKeyMap = {
	registeredUsers: true,
	userSessions: true,
	accountLinks: true,
	userHeaders: true,
	userStatuses: true,
	userTutorials: true,
	userInventories: true,
	userCards: true,
	userDecks: true,
	userPresentBoxes: true,
	userArchiveCollections: true,
	userActivityRecords: true,
	archiveGiftPoints: true,
	contentReleaseEffects: true,
	userFriendCards: true,
	userSocials: true,
	userGachas: true,
	userProfileSettings: true,
	userProfileDesigns: true,
	userSiscaStores: true,
	userShopExchanges: true,
	userNotifications: true,
	userCircleNotifications: true,
	userLives: true,
	userChapters: true,
	userDailyQuestStates: true,
	userBeginnerMissions: true,
	userStepUpBeginnerMissions: true,
	userMissions: true,
	rewardClaims: true,
} satisfies Record<PlayerOwnedStateKey, true>;

const playerOwnedStateKeys = Object.keys(
	playerOwnedStateKeyMap,
) as PlayerOwnedStateKey[];

export function removePlayerOwnedEntries<T extends PlayerOwnedEntry>(
	entries: readonly T[],
	playerId: string,
): T[] {
	return entries.filter((entry) => entry.playerId !== playerId);
}

export function removePlayerOwnedState(
	state: ServerState,
	playerId: string,
): void {
	for (const key of playerOwnedStateKeys) {
		removePlayerOwnedStateEntries(state, key, playerId);
	}
}

export function renamePlayerOwnedState(
	state: ServerState,
	currentPlayerId: string,
	nextPlayerId: string,
): void {
	for (const key of playerOwnedStateKeys) {
		const entries = state[key] as PlayerOwnedEntry[];
		for (const entry of entries) {
			if (entry.playerId === currentPlayerId) entry.playerId = nextPlayerId;
		}
	}
}

function removePlayerOwnedStateEntries<K extends PlayerOwnedStateKey>(
	state: ServerState,
	key: K,
	playerId: string,
): void {
	const entries = state[key] as PlayerOwnedEntry[];
	state[key] = removePlayerOwnedEntries(entries, playerId) as ServerState[K];
}
