import type { Database } from 'bun:sqlite';
import {
	mergeRhythmGameGrandPrixDeckCards,
	projectRhythmGameGrandPrixDeckCards,
} from '../../application/rhythm-game-grand-prix-deck-projection.ts';
import { getRhythmGameGrandPrixSeriesRows } from '../../master-data/grand-prix-master-queries.ts';
import { createRhythmGameGrandPrixSeriesIdentityFingerprint } from '../../master-data/rhythm-game-grand-prix-series-identity.ts';
import { resetRhythmGameGrandPrixDecks } from '../../state/rhythm-game-grand-prix-deck-state.ts';
import {
	ensureUserRhythmGameGrandPrixState,
	findRhythmGameGrandPrixSeriesProgress,
	saveRhythmGameGrandPrixSeriesProgress,
} from '../../state/rhythm-game-grand-prix-series-progress.ts';
import type { UserLiveState } from '../../state/user-live-state.ts';
import { isJsonRecord } from '../route-support/request-fields.ts';
import { numberField, numberValue } from './json-utils.ts';
import {
	setVisibleRhythmGameGrandPrixDeckCenter,
	setVisibleRhythmGameGrandPrixDeckPositions,
} from './rhythm-game-grand-prix-deck-mutation.ts';
import {
	readRhythmGameGrandPrixDeckCardList,
	readRhythmGameGrandPrixPositionList,
} from './rhythm-game-grand-prix-deck-request.ts';
import { findRhythmGameGrandPrixDeckSeries } from './rhythm-game-grand-prix-deck-series-lookup.ts';
import {
	createRhythmGameGrandPrixDeckCardListResponse,
	createRhythmGameGrandPrixEmptyResponse,
} from './rhythm-game-grand-prix-response-values.ts';

import type { StoredResponse } from './types.ts';

export function setRhythmGameGrandPrixDeck(
	database: Database,
	sourceMasterReleaseId: string,
	body: unknown,
	userLive: UserLiveState,
	visibleCardDataIds: ReadonlySet<string>,
): StoredResponse | undefined {
	if (!isJsonRecord(body) || !Array.isArray(body.deck_card_list))
		return undefined;
	const seriesId = numberValue(body.grand_prix_rhythm_game_series_id);
	const series = findRhythmGameGrandPrixDeckSeries(database, seriesId);
	if (!series) return undefined;
	const grandPrix = ensureUserRhythmGameGrandPrixState(
		userLive,
		series.grandPrixId,
	);
	const current = findRhythmGameGrandPrixSeriesProgress(
		grandPrix,
		seriesId,
		series.identityFingerprint,
	);
	const visible = readRhythmGameGrandPrixDeckCardList(
		body.deck_card_list,
		projectRhythmGameGrandPrixDeckCards(
			current.deckCardList,
			visibleCardDataIds,
		),
	);
	const canonical = mergeRhythmGameGrandPrixDeckCards(
		current.deckCardList,
		visible,
		visibleCardDataIds,
	);
	saveRhythmGameGrandPrixSeriesProgress(grandPrix, {
		...current,
		sourceMasterReleaseId,
		identityFingerprint: series.identityFingerprint,
		deckCardList: canonical,
	});
	return createRhythmGameGrandPrixDeckCardListResponse(visible);
}

export function setRhythmGameGrandPrixCenter(
	database: Database,
	sourceMasterReleaseId: string,
	body: unknown,
	userLive: UserLiveState,
	visibleCardDataIds: ReadonlySet<string>,
): StoredResponse | undefined {
	if (!isJsonRecord(body)) return undefined;
	const seriesId = numberValue(body.grand_prix_rhythm_game_series_id);
	const series = findRhythmGameGrandPrixDeckSeries(database, seriesId);
	if (!series) return undefined;
	const grandPrix = ensureUserRhythmGameGrandPrixState(
		userLive,
		series.grandPrixId,
	);
	const current = findRhythmGameGrandPrixSeriesProgress(
		grandPrix,
		seriesId,
		series.identityFingerprint,
	);
	const result = setVisibleRhythmGameGrandPrixDeckCenter(
		current.deckCardList,
		visibleCardDataIds,
		numberValue(body.slot_no),
	);
	saveRhythmGameGrandPrixSeriesProgress(grandPrix, {
		...current,
		sourceMasterReleaseId,
		identityFingerprint: series.identityFingerprint,
		deckCardList: result.canonical,
	});
	return createRhythmGameGrandPrixDeckCardListResponse(result.visible);
}

export function setRhythmGameGrandPrixPosition(
	database: Database,
	sourceMasterReleaseId: string,
	body: unknown,
	userLive: UserLiveState,
	visibleCardDataIds: ReadonlySet<string>,
): StoredResponse | undefined {
	if (!isJsonRecord(body) || !Array.isArray(body.deck_card_list))
		return undefined;
	const seriesId = numberValue(body.grand_prix_rhythm_game_series_id);
	const series = findRhythmGameGrandPrixDeckSeries(database, seriesId);
	if (!series) return undefined;
	const grandPrix = ensureUserRhythmGameGrandPrixState(
		userLive,
		series.grandPrixId,
	);
	const current = findRhythmGameGrandPrixSeriesProgress(
		grandPrix,
		seriesId,
		series.identityFingerprint,
	);
	const result = setVisibleRhythmGameGrandPrixDeckPositions(
		current.deckCardList,
		visibleCardDataIds,
		readRhythmGameGrandPrixPositionList(body.deck_card_list),
	);
	saveRhythmGameGrandPrixSeriesProgress(grandPrix, {
		...current,
		sourceMasterReleaseId,
		identityFingerprint: series.identityFingerprint,
		deckCardList: result.canonical,
	});
	return createRhythmGameGrandPrixDeckCardListResponse(result.visible);
}

export function resetRhythmGameGrandPrixDeck(
	database: Database,
	body: unknown,
	userLive: UserLiveState,
	visibleCardDataIds: ReadonlySet<string>,
): StoredResponse | undefined {
	const grandPrixId = numberField(body, 'grand_prix_id');
	if (grandPrixId <= 0) return undefined;
	resetRhythmGameGrandPrixDecks(
		ensureUserRhythmGameGrandPrixState(userLive, grandPrixId),
		visibleCardDataIds,
		new Map(
			getRhythmGameGrandPrixSeriesRows(database, grandPrixId).map((series) => [
				series.id,
				createRhythmGameGrandPrixSeriesIdentityFingerprint(series),
			]),
		),
	);
	return createRhythmGameGrandPrixEmptyResponse();
}
