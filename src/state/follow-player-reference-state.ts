import type { ServerState } from '../server-state-schema.ts';

export function removeFollowRelationsForUser(
	state: ServerState,
	playerId: string,
): void {
	state.followRelations = state.followRelations.filter(
		(relation) =>
			relation.playerId !== playerId && relation.targetPlayerId !== playerId,
	);
}

export function renameFollowRelationsForUser(
	state: ServerState,
	currentPlayerId: string,
	nextPlayerId: string,
): void {
	state.followRelations = state.followRelations.map((relation) => ({
		playerId:
			relation.playerId === currentPlayerId ? nextPlayerId : relation.playerId,
		targetPlayerId:
			relation.targetPlayerId === currentPlayerId
				? nextPlayerId
				: relation.targetPlayerId,
	}));
}
