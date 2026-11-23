import type { Database } from 'bun:sqlite';
import { getQuestStageIdentityFingerprint } from '../../master-data/quest-stage-identity.ts';
import { findUserDeckById } from '../../state/user-deck-aggregate.ts';
import type { UserDeckState } from '../../state/user-deck-definition.ts';
import type { UserLiveState } from '../../state/user-live-state.ts';
import { findUserQuestStageProgress } from '../../state/user-standard-quest-progress.ts';
import type { QuestLiveFriendCardResponse } from '../response-types/follow-response-types.ts';
import type { QuestMemberFanLevelResponse } from '../response-types/quest-common-response-types.ts';
import type { UserCardDataResponse } from '../response-types/user-card-deck-response-types.ts';
import {
	createDeckListResponse,
	createDeckResponse,
} from '../responses/deck-response.ts';
import {
	getStringField,
	isJsonRecord,
} from '../route-support/request-fields.ts';
import { stamina } from './basic-data.ts';
import { findGradeChallengeStageMusic } from './grade-challenge-stage.ts';
import { booleanField, numberField } from './json-utils.ts';
import { getCharacterBonusFromDatabase } from './live-character-bonus.ts';
import { musicListForQuestFromDatabase } from './music-list-data.ts';
import { createQuestLiveInfoBody } from './quest-live-info-response.ts';
import { findQuestStageMusicFromDatabase } from './quest-stage-data.ts';

type QuestLiveStageMusic = {
	musicId: number;
	questMusicsType: number;
};

export function getQuestLiveSetting(
	database: Database,
	body: unknown,
	userLive: UserLiveState,
	userCardDataList: UserCardDataResponse[],
	userDeck: UserDeckState,
	friendCardList: QuestLiveFriendCardResponse[],
) {
	const stageId = requiredNumberField(body, 'stage_id');
	const questLiveType = requiredNumberField(body, 'quest_live_type');
	if (stageId === null || questLiveType === null) return undefined;
	const stage = findQuestLiveSettingStageMusic(
		database,
		questLiveType,
		stageId,
	);
	const progress = findUserQuestStageProgress(
		userLive,
		questLiveType,
		stageId,
		getQuestStageIdentityFingerprint(database, questLiveType, stageId),
	);
	const bestLoveDeck: Record<string, never> = {};
	return {
		body: {
			quest_live_type: questLiveType,
			stage_id: stageId,
			deck_data: createDeckListResponse(userDeck, []).deck_list,
			best_love_deck: bestLoveDeck,
			best_love_musics_id: progress.bestLoveMusicId ?? 0,
			user_stamina: stamina(),
			music_list: musicListForQuestFromDatabase(
				database,
				stage.questMusicsType,
				stage.musicId,
			),
			user_card_data_list: userCardDataList,
			rental_deck_data: [] satisfies [],
			rental_card_data_list: [] satisfies [],
			friend_card_list: friendCardList,
		},
		statusCode: 200,
	};
}

export function setQuestLiveSetting(
	database: Database,
	masterReleaseId: string,
	body: unknown,
	userLive: UserLiveState,
	userDeck: UserDeckState,
	userCardDataList: UserCardDataResponse[],
	fanLevelList: readonly QuestMemberFanLevelResponse[],
) {
	if (!isJsonRecord(body)) return undefined;
	const stageId = requiredNumberField(body, 'stage_id');
	const questLiveType = requiredNumberField(body, 'quest_live_type');
	if (stageId === null || questLiveType === null) return undefined;
	const stage = findQuestLiveSettingStageMusic(
		database,
		questLiveType,
		stageId,
	);
	const musicId = resolveQuestLiveMusicId(
		stage,
		requiredNumberField(body, 'music_id'),
	);
	if (musicId <= 0) return undefined;
	const deckId = getStringField(body, 'deck_id');
	const deck =
		deckId.length > 0 ? findUserDeckById(userDeck, deckId) : undefined;
	const deckData = deck ? createDeckResponse(deck) : {};
	userLive.currentQuestLive = {
		masterReleaseId,
		questLiveId: `${questLiveType}_${stageId}`,
		questLiveType,
		stageId,
		musicId,
		isChallengeMode: booleanField(body, 'is_challenge_mode'),
		isRehearsal: booleanField(body, 'is_rehearsal'),
		deckData,
		characterBonus: getCharacterBonusFromDatabase(
			database,
			deckData,
			userCardDataList,
		),
		startTime: '',
		score: 0,
		playReport: '',
	};
	return {
		body: createQuestLiveInfoBody(
			database,
			userLive.currentQuestLive,
			userLive,
			fanLevelList,
		),
		statusCode: 200,
	};
}

export function resolveQuestLiveMusicId(
	stage: QuestLiveStageMusic,
	requestMusicId: number | null,
): number {
	if (stage.questMusicsType === 2 && stage.musicId > 0) {
		return requestMusicId === null ||
			requestMusicId <= 0 ||
			requestMusicId === stage.musicId
			? stage.musicId
			: 0;
	}
	return requestMusicId === null || requestMusicId <= 0
		? stage.musicId
		: requestMusicId;
}

function requiredNumberField(body: unknown, name: string): number | null {
	const value = numberField(body, name);
	return Number.isFinite(value) && value > 0 ? value : null;
}

function findQuestLiveSettingStageMusic(
	database: Database,
	questLiveType: number,
	stageId: number,
): QuestLiveStageMusic {
	return questLiveType === 10
		? findGradeChallengeStageMusic(database, stageId)
		: findQuestStageMusicFromDatabase(database, stageId);
}
