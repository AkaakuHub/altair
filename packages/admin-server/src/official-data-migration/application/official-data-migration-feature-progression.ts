import type { ServerState } from '../../../../../src/server-state-schema.ts';
import type { OfficialDataMigrationDump } from './official-data-migration-dump.ts';
import type { OfficialDataMigrationApplyResultCollector } from './official-data-migration-feature-types.ts';
import {
	createChapterFromDump,
	createDailyQuestFromDump,
} from './projectors/official-data-migration-apply-chapter.ts';
import { createGachaFromResponses } from './projectors/official-data-migration-apply-gacha.ts';
import { applyUserLiveFromDump } from './projectors/official-data-migration-apply-live-chapter.ts';
import {
	createBeginnerMissionsFromResponse,
	createMissionsFromResponse,
	createStepUpBeginnerMissionsFromResponse,
} from './projectors/official-data-migration-apply-missions.ts';
import { createPresentBoxFromResponses } from './projectors/official-data-migration-apply-present-box.ts';
import { upsertMigrationPlayerState } from './projectors/official-data-migration-apply-upsert.ts';
import { replaceMigrationPlayerChapter } from './projectors/official-data-migration-player-replacement.ts';

export function applyOfficialDataMigrationProgressionFeatures(
	state: ServerState,
	dump: OfficialDataMigrationDump,
	playerId: string,
	collector: OfficialDataMigrationApplyResultCollector,
	database: Database,
): void {
	const missions = createMissionsFromResponse(
		playerId,
		dump.responsesByPath.get('/v1/mission/get_list'),
	);
	if (missions !== null) {
		upsertMigrationPlayerState(state.userMissions, missions);
		collector.addCategory('userMissions');
	}
	const beginner = createBeginnerMissionsFromResponse(
		playerId,
		dump.responsesByPath.get('/v1/beginner_mission/get_list'),
	);
	if (beginner !== null) {
		upsertMigrationPlayerState(state.userBeginnerMissions, beginner);
		collector.addCategory('userBeginnerMissions');
	}
	const stepUp = createStepUpBeginnerMissionsFromResponse(
		playerId,
		dump.responsesByPath.get('/v1/step_up_beginner_mission/get_list'),
	);
	if (stepUp !== null) {
		upsertMigrationPlayerState(state.userStepUpBeginnerMissions, stepUp);
		collector.addCategory('userStepUpBeginnerMissions');
	}
	const presentBox = createPresentBoxFromResponses(
		playerId,
		dump.responsesByPath.get('/v1/present_box/get_list'),
		dump.responsesByPath.get('/v1/present_box/get_history'),
	);
	if (presentBox !== null) {
		upsertMigrationPlayerState(state.userPresentBoxes, presentBox);
		collector.addCategory('userPresentBoxes');
	}
	const gacha = createGachaFromResponses(
		playerId,
		dump.responsesByPath.get('/v1/gacha/get_series_list'),
		dump.responsesByPath.get('/v1/gacha/get_history'),
		dump.events,
	);
	if (gacha !== null) {
		upsertMigrationPlayerState(state.userGachas, gacha);
		collector.addCategory('userGachas');
	}
	if (applyUserLiveFromDump(state, playerId, dump, database))
		collector.addCategory('userLives');
	const dailyQuest = createDailyQuestFromDump(playerId, dump);
	if (dailyQuest !== null) {
		upsertMigrationPlayerState(state.userDailyQuestStates, dailyQuest);
		collector.addCategory('userDailyQuestStates');
	}
	const chapter = createChapterFromDump(playerId, dump);
	if (chapter !== null) {
		state.userChapters = replaceMigrationPlayerChapter(
			state.userChapters,
			chapter,
		);
		collector.addCategory('userChapters');
	}
}

import type { Database } from 'bun:sqlite';
