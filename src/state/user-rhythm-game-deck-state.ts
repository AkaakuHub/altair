import type {
	UserRhythmGameDeckState,
	UserRhythmGameStateOwner,
} from './user-rhythm-game-types.ts';
export function ensureUserRhythmGameDecks(
	userLive: UserRhythmGameStateOwner,
	defaults: UserRhythmGameDeckState[],
): UserRhythmGameDeckState[] {
	if (userLive.rhythmGameDecks.length > 0) return userLive.rhythmGameDecks;
	userLive.rhythmGameDecks = defaults.map((deck) => ({
		...deck,
		deckCardList: structuredClone(deck.deckCardList),
	}));
	return userLive.rhythmGameDecks;
}
