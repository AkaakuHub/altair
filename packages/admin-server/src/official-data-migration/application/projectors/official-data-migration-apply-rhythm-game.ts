import type { Database } from 'bun:sqlite';
import { getGrandPrixRankingMasterFromDatabase } from '../../../../../../src/master-data/grand-prix-ranking-master.ts';
import type { ServerState } from '../../../../../../src/server-state-schema.ts';
import { updateGrandPrixRankingsFromProgress } from '../../../../../../src/state/grand-prix-ranking-aggregate.ts';
import type { JsonObject } from '../../../../../../src/state/json-state-utils.ts';
import { isJsonObject } from '../../../../../../src/state/json-state-utils.ts';
import {
	ensureUserRhythmGameGrandPrixState,
	saveRhythmGameGrandPrixSeriesProgress,
} from '../../../../../../src/state/rhythm-game-grand-prix-series-progress.ts';
import type { UserLiveState } from '../../../../../../src/state/user-live-state.ts';
import { setUserRhythmGameClassMissionReceivedOrder } from '../../../../../../src/state/user-rhythm-class-mission-order.ts';
import type {
	UserRhythmGameDeckState,
	UserRhythmMusicScoreState,
} from '../../../../../../src/state/user-rhythm-game-types.ts';
import {
	findLegacyUserRhythmMusicScore,
	saveLegacyUserRhythmMusicScore,
} from '../../../../../../src/state/user-rhythm-music-score-progress.ts';
import {
	type JsonRecord,
	type OfficialApiDumpEvent,
	readJsonValueArray,
	readNumber,
	readRecordArray,
	readString,
} from '../official-data-migration-dump.ts';
import { latestOfficialDataMigrationResponse } from './official-data-migration-apply-events.ts';
import { upsertByStringKey } from './official-data-migration-apply-upsert-list.ts';

export function applyRhythmGameHome(
	live: UserLiveState,
	events: readonly OfficialApiDumpEvent[],
): boolean {
	const response = latestOfficialDataMigrationResponse(
		events,
		'/v1/rhythm_game/home',
	);
	if (response === null) {
		return false;
	}
	const musicScores = readRecordArray(response.music_list)
		.map((music) => createRhythmMusicScore(live, music))
		.filter((score): score is UserRhythmMusicScoreState => score !== null);
	for (const score of musicScores) {
		saveLegacyUserRhythmMusicScore(live, score);
	}
	const decks = readRecordArray(response.rhythm_game_deck_list)
		.map(createRhythmGameDeck)
		.filter((deck): deck is UserRhythmGameDeckState => deck !== null);
	if (decks.length > 0) {
		live.rhythmGameDecks = upsertByStringKey(
			live.rhythmGameDecks,
			decks,
			(deck) => deck.rhythmGameDeckId,
		);
	}
	let classMissionApplied = false;
	for (const mission of readRecordArray(response.class_mission_list)) {
		const conditionType = readNumber(mission.condition_type);
		const receivedOrder = readNumber(mission.received_order);
		if (conditionType !== null && receivedOrder !== null) {
			setUserRhythmGameClassMissionReceivedOrder(
				live,
				conditionType,
				receivedOrder,
			);
			classMissionApplied = true;
		}
	}
	return musicScores.length > 0 || decks.length > 0 || classMissionApplied;
}

export function applyRhythmGameGrandPrix(
	state: ServerState,
	live: UserLiveState,
	events: readonly OfficialApiDumpEvent[],
	database: Database,
): boolean {
	const response = latestOfficialDataMigrationResponse(
		events,
		'/v1/rhythm_game_grand_prix/top',
	);
	if (response === null) {
		return false;
	}
	const seriesList = readRecordArray(response.series_list);
	const firstSeriesId = seriesList
		.map((series) => readNumber(series.grand_prix_rhythm_game_series_id))
		.find((seriesId): seriesId is number => seriesId !== null);
	if (firstSeriesId === undefined) {
		return false;
	}
	const grandPrixId = findGrandPrixIdByRhythmGameSeriesId(
		database,
		firstSeriesId,
	);
	if (grandPrixId === undefined) {
		return false;
	}
	const grandPrix = ensureUserRhythmGameGrandPrixState(live, grandPrixId);
	let applied = false;
	for (const series of seriesList) {
		const progress = createRhythmGameGrandPrixSeriesProgress(series);
		if (progress !== null) {
			saveRhythmGameGrandPrixSeriesProgress(grandPrix, progress);
			applied = true;
		}
	}
	if (applied) {
		updateGrandPrixRankingsFromProgress(
			state,
			grandPrixId,
			getGrandPrixRankingMasterFromDatabase(database, grandPrixId),
		);
	}
	return applied;
}

function createRhythmMusicScore(
	live: UserLiveState,
	music: JsonRecord,
): UserRhythmMusicScoreState | null {
	const musicId = readNumber(music.music_id);
	if (musicId === null) {
		return null;
	}
	const current = findLegacyUserRhythmMusicScore(live, musicId);
	return {
		musicId,
		highScore: readNumber(music.high_score) ?? current.highScore,
		highScoreAchievementStatus:
			readNumber(music.high_score_achievement_status) ??
			current.highScoreAchievementStatus,
		clearCount: current.clearCount,
		totalScoreAccumulated: current.totalScoreAccumulated,
		musicMasteryLevel:
			readNumber(music.music_mastery_level) ?? current.musicMasteryLevel,
		musicMasteryExperience: current.musicMasteryExperience,
		difficultyScores: readRecordArray(music.music_scores).filter(
			(score): score is JsonObject => isJsonObject(score),
		),
	};
}

function createRhythmGameGrandPrixSeriesProgress(series: JsonRecord) {
	const grandPrixRhythmGameSeriesId = readNumber(
		series.grand_prix_rhythm_game_series_id,
	);
	if (grandPrixRhythmGameSeriesId === null) {
		return null;
	}
	return {
		grandPrixRhythmGameSeriesId,
		highScore: readNumber(series.best_score) ?? 0,
		currentDailyPoint: readNumber(series.current_daily_point) ?? 0,
		playCount: readNumber(series.play_count) ?? 0,
		deckCardList: readRecordArray(series.deck_card_list).flatMap(
			createRhythmGameGrandPrixDeckCard,
		),
	};
}

function createRhythmGameGrandPrixDeckCard(card: JsonRecord) {
	const seriesDeckCardDatasId = readString(card.series_deck_card_datas_id);
	const dCardDatasId = readString(card.d_card_datas_id);
	const slotNo = readNumber(card.slot_no);
	if (
		seriesDeckCardDatasId === null ||
		dCardDatasId === null ||
		slotNo === null
	) {
		return [];
	}
	return [
		{
			seriesDeckCardDatasId,
			dCardDatasId,
			slotNo,
			isCenter: card.is_center === true,
		},
	];
}

function createRhythmGameDeck(
	deck: JsonRecord,
): UserRhythmGameDeckState | null {
	const rhythmGameDeckId = readString(deck.rhythm_game_deck_id);
	if (rhythmGameDeckId === null) {
		return null;
	}
	return {
		rhythmGameDeckId,
		name: readString(deck.name) ?? '',
		deckNo: readNumber(deck.deck_no) ?? 0,
		deckCardList: readJsonValueArray(deck.deck_card_list),
	};
}

function findGrandPrixIdByRhythmGameSeriesId(
	database: Database,
	grandPrixRhythmGameSeriesId: number,
): number | undefined {
	const row = database
		.query<{ grand_prixes_id: number }, [number]>(
			[
				'SELECT grand_prixes_id',
				'FROM master_grand_prix_rhythm_game_series',
				'WHERE id = ?',
			].join(' '),
		)
		.get(grandPrixRhythmGameSeriesId);
	return row?.grand_prixes_id;
}
