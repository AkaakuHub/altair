import type { ServerState } from '../../server-state-schema.ts';

export function retireCurrentRhythmGame(
	state: Pick<ServerState, 'userLives'>,
	playerId: string,
): boolean {
	const live = state.userLives.find((entry) => entry.playerId === playerId);
	if (live === undefined || live.currentRhythmGame === null) return false;
	live.currentRhythmGame = null;
	return true;
}
