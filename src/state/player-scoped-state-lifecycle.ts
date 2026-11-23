import type { ServerState } from '../server-state-schema.ts';
import {
	removeCircleReferencesForUser,
	renameCircleReferencesForUser,
} from './circle-player-reference-state.ts';
import {
	removeFollowRelationsForUser,
	renameFollowRelationsForUser,
} from './follow-player-reference-state.ts';
import {
	removePlayerOwnedState,
	renamePlayerOwnedState,
} from './player-owned-state-collection.ts';

export function removePlayerScopedState(
	state: ServerState,
	playerId: string,
): void {
	removePlayerOwnedState(state, playerId);
	removeFollowRelationsForUser(state, playerId);
	removeCircleReferencesForUser(state, playerId);
}

export function renamePlayerScopedState(
	state: ServerState,
	currentPlayerId: string,
	nextPlayerId: string,
): void {
	renamePlayerOwnedState(state, currentPlayerId, nextPlayerId);
	renameFollowRelationsForUser(state, currentPlayerId, nextPlayerId);
	renameCircleReferencesForUser(state, currentPlayerId, nextPlayerId);
}
