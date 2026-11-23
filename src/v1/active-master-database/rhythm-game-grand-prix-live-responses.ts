import type { Database } from 'bun:sqlite';
import {
	projectUserCards,
	type UserOwnedMasterSupport,
} from '../../application/user-owned-master-projection.ts';
import { getGrandPrixRankingMasterFromDatabase } from '../../master-data/grand-prix-ranking-master.ts';
import { createUserOwnedMasterSupport } from '../../master-data/user-owned-master-support.ts';
import type {
	RegisteredUserState,
	ServerState,
} from '../../server-state-schema.ts';
import { isSameEntityIdentity } from '../../state/entity-provenance.ts';
import { updateGrandPrixRankingsFromProgress } from '../../state/grand-prix-ranking-aggregate.ts';
import {
	ensureUserRhythmGameGrandPrixState,
	findRhythmGameGrandPrixSeriesProgress,
	recordRhythmGameGrandPrixSeriesResult,
} from '../../state/rhythm-game-grand-prix-series-progress.ts';
import type { UserRhythmGameGrandPrixDeckCardState } from '../../state/rhythm-game-grand-prix-types.ts';
import {
	findUserCard,
	findUserCards,
} from '../../state/user-card-aggregate-state.ts';
import type { UserLiveState } from '../../state/user-live-state.ts';
import {
	getStringField,
	isJsonRecord,
} from '../route-support/request-fields.ts';
import {
	calculateGrandPrixScorePoint,
	createGrandPrixPointBonusListFromDatabase,
	type GrandPrixCardBonusTarget,
} from './grand-prix-point-bonus.ts';
import { numberValue } from './json-utils.ts';
import { createRhythmGameGrandPrixEmptyResponse } from './rhythm-game-grand-prix-response-values.ts';
import {
	findGrandPrixIdByRhythmGameSeriesId,
	getRhythmGameGrandPrixSeriesIdentityFingerprint,
} from './rhythm-game-grand-prix-series-master.ts';
import { recordRhythmGameFinishResult } from './rhythm-game-live-responses.ts';
import type { StoredResponse } from './types.ts';

type RhythmGameGrandPrixMutationSource = Pick<
	ServerState,
	'circle' | 'grandPrixRankings' | 'registeredUsers' | 'userCards' | 'userLives'
>;

export function setRhythmGameGrandPrixStartLive(
	database: Database,
	masterReleaseId: string,
	body: unknown,
	userLive: UserLiveState,
): StoredResponse | undefined {
	if (!isJsonRecord(body)) {
		return undefined;
	}
	const seriesId = numberValue(body.grand_prix_rhythm_game_series_id);
	const grandPrixId = findGrandPrixIdByRhythmGameSeriesId(database, seriesId);
	const identityFingerprint = getRhythmGameGrandPrixSeriesIdentityFingerprint(
		database,
		seriesId,
	);
	if (grandPrixId === undefined || identityFingerprint === undefined) {
		return undefined;
	}
	userLive.currentRhythmGameGrandPrix = {
		masterReleaseId,
		identityFingerprint,
		grandPrixId,
		grandPrixRhythmGameSeriesId: seriesId,
		musicId: numberValue(body.music_id),
		difficulty: numberValue(body.music_score_difficulty) || 1,
		friendCardPlayerId: getStringField(body, 'friend_card_player_id'),
		friendCardId: getStringField(body, 'friend_card_id'),
	};
	return createRhythmGameGrandPrixEmptyResponse();
}

export function retireRhythmGameGrandPrixLive(
	userLive: UserLiveState,
): StoredResponse {
	userLive.currentRhythmGameGrandPrix = null;
	return createRhythmGameGrandPrixEmptyResponse();
}

export function setRhythmGameGrandPrixFinishLive(
	database: Database,
	body: unknown,
	user: RegisteredUserState,
	state: RhythmGameGrandPrixMutationSource,
	userLive: UserLiveState,
): StoredResponse | undefined {
	const current = userLive.currentRhythmGameGrandPrix;
	if (!isJsonRecord(body) || current === null) {
		return undefined;
	}
	if (current.masterReleaseId === undefined) return undefined;
	const finishResult = recordRhythmGameFinishResult(
		database,
		current.masterReleaseId,
		body,
		userLive,
		{
			musicId: current.musicId,
			difficulty: current.difficulty,
			consumeStaminaMagnification: 0,
		},
		0,
	);
	if (finishResult === undefined) {
		return undefined;
	}
	const grandPrix = ensureUserRhythmGameGrandPrixState(
		userLive,
		current.grandPrixId,
	);
	const identityFingerprint = getRhythmGameGrandPrixSeriesIdentityFingerprint(
		database,
		current.grandPrixRhythmGameSeriesId,
	);
	if (
		identityFingerprint === undefined ||
		(current.identityFingerprint !== undefined &&
			!isSameEntityIdentity(current.identityFingerprint, identityFingerprint))
	)
		return undefined;
	const currentSeries = findRhythmGameGrandPrixSeriesProgress(
		grandPrix,
		current.grandPrixRhythmGameSeriesId,
		identityFingerprint,
	);
	const pointBonusList = createGrandPrixPointBonusListFromDatabase(
		database,
		current.grandPrixId,
		rhythmGameGrandPrixCardBonusTargets(
			state,
			user.playerId,
			currentSeries.deckCardList,
			createUserOwnedMasterSupport(database),
		),
	);
	const point = calculateGrandPrixScorePoint(
		numberValue(body.score),
		pointBonusList,
	);
	recordRhythmGameGrandPrixSeriesResult(
		grandPrix,
		current.grandPrixRhythmGameSeriesId,
		numberValue(body.score),
		point,
		identityFingerprint,
		current.masterReleaseId,
	);
	updateGrandPrixRankingsFromProgress(
		state,
		current.grandPrixId,
		getGrandPrixRankingMasterFromDatabase(database, current.grandPrixId),
		current.masterReleaseId,
	);
	userLive.currentRhythmGameGrandPrix = null;
	return {
		body: {
			music_score_mission_result: finishResult.musicScoreMissionResult,
			clear_status: finishResult.clearStatus,
			class_mission_progress_list: finishResult.classMissionProgressList,
			rhythm_game_star_total_count: finishResult.rhythmGameStarTotalCount,
			grand_prix_point_info: {
				point,
				point_bonus_list: pointBonusList,
				before_point: currentSeries.currentDailyPoint,
			},
		},
		statusCode: 200,
	};
}

export function rhythmGameGrandPrixCardBonusTargets(
	state: Pick<ServerState, 'userCards'>,
	playerId: string,
	deckCardList: UserRhythmGameGrandPrixDeckCardState[],
	masterSupport: Pick<UserOwnedMasterSupport, 'getCardFingerprint' | 'hasCard'>,
): GrandPrixCardBonusTarget[] {
	const canonicalCards = findUserCards(state, playerId);
	if (canonicalCards === undefined) {
		return [];
	}
	const cards = projectUserCards(canonicalCards, masterSupport);
	return deckCardList.flatMap((deckCard) => {
		const card = findUserCard(cards, deckCard.dCardDatasId);
		if (card === undefined) {
			return [];
		}
		const cardId = numberValue(card.card_datas_id);
		if (cardId <= 0) {
			return [];
		}
		return [
			{
				cardId,
				limitBreakCount: numberValue(card.limit_break_times),
			},
		];
	});
}
