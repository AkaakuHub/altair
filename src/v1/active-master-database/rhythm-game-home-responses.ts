import type { Database } from 'bun:sqlite';
import { projectCompatibleMusicProgresses } from '../../application/music-progress-projection.ts';
import { projectRhythmGameDecks } from '../../application/rhythm-game-deck-projection.ts';
import {
	getMusicIdentityFingerprint,
	getMusicIdentityFingerprints,
} from '../../master-data/entity-identity-fingerprints.ts';
import { calculateRhythmGameStarTotal } from '../../state/mission-star-progress.ts';
import type { UserLiveState } from '../../state/user-live-state.ts';
import { ensureUserRhythmGameDecks } from '../../state/user-rhythm-game-deck-state.ts';
import { findUserRhythmMusicScore } from '../../state/user-rhythm-music-score-progress.ts';
import type { QuestLiveFriendCardResponse } from '../response-types/follow-response-types.ts';
import type { UserCardDataResponse } from '../response-types/user-card-deck-response-types.ts';
import { collectionMusicInfoList } from './collection-responses.ts';
import { numberValue } from './json-utils.ts';
import { createRhythmGameClassMissionList } from './rhythm-game-class-mission-responses.ts';

export function getRhythmGameHome(
	database: Database,
	userCardDataList: UserCardDataResponse[],
	userLive: UserLiveState,
	fanLevelList: ReadonlyArray<{
		character_id: number;
		member_fan_level: number;
	}>,
	nextResetTime: string,
	friendCardList: QuestLiveFriendCardResponse[],
	visibleCardDataIds: ReadonlySet<string>,
) {
	const visibleUserLive = {
		...userLive,
		rhythmMusicScores: projectCompatibleMusicProgresses(
			userLive.rhythmMusicScores,
			getMusicIdentityFingerprints(database),
		),
	};
	const musicList = collectionMusicInfoList(database).map((musicInfo) => {
		const musicId = numberValue(musicInfo.musics_id);
		const identityFingerprint = getMusicIdentityFingerprint(database, musicId);
		if (identityFingerprint === undefined) {
			throw new Error(`music master not found: ${musicId}`);
		}
		const score = findUserRhythmMusicScore(
			visibleUserLive,
			musicId,
			identityFingerprint,
		);
		return {
			music_id: musicId,
			high_score: score.highScore,
			high_score_achievement_status: score.highScoreAchievementStatus,
			music_mastery_level: score.musicMasteryLevel,
			music_scores: score.difficultyScores,
		};
	});

	const deckRows = ensureUserRhythmGameDecks(userLive, []);

	return {
		body: {
			music_list: musicList,
			rhythm_game_deck_list: projectRhythmGameDecks(
				deckRows,
				visibleCardDataIds,
			).map((row) => ({
				rhythm_game_deck_id: row.rhythmGameDeckId,
				name: row.name,
				deck_no: row.deckNo,
				deck_card_list: row.deckCardList,
			})),
			card_data_list: createRhythmGameCardDataList(userCardDataList),
			class_mission_list: createRhythmGameClassMissionList(visibleUserLive),
			received_total_mission_order: 99,
			rhythm_game_star_total_count:
				calculateRhythmGameStarTotal(visibleUserLive),
			member_fanlevel_list: fanLevelList.map((row) => ({
				characters_id: row.character_id,
				member_fanlevel: row.member_fan_level,
			})),
			friend_card_list: friendCardList,
			auto_play_ticket_info: {
				num: 10,
				max: 10,
				next_reset_time: nextResetTime,
			},
		},
		statusCode: 200,
	};
}

function createRhythmGameCardDataList(
	userCardDataList: UserCardDataResponse[],
) {
	return userCardDataList.map((card) => createRhythmGameCardData(card));
}

function createRhythmGameCardData(card: UserCardDataResponse) {
	return {
		...card,
		card_sort_order: 0,
		character_bonus: {
			character_id: 0,
			music_mastery_bonus: 0,
			love_correction_value: 0,
			music_mastery_bonus_list: null,
			season_fan_level: 0,
		},
		is_evolve_possible: true,
		is_evolve_max: false,
	};
}
