import {
	calculateRhythmGameStarTotal,
	calculateStandardQuestStarTotal,
} from '../state/mission-star-progress.ts';
import type { UserLiveState } from '../state/user-live-state.ts';
import type { UserQuestStageProgressState } from '../state/user-quest-progress-types.ts';

const standardQuestClearTransitionId = 100;
const questLiveClearTransitionId = 101;
const dailyQuestClearTransitionId = 103;
const dreamQuestClearTransitionId = 106;
const homeWallpaperSettingTransitionId = 301;
const profileCardSettingTransitionId = 305;
const rhythmGameClearTransitionId = 800;

export type MissionProgressEvent =
	| {
			type: 'questClear';
			playerId: string;
			questLiveType: number;
			isSkip: boolean;
			gameDate: string;
			userLive?: UserLiveState;
	  }
	| {
			type: 'rhythmGameClear';
			playerId: string;
			userLive?: UserLiveState;
	  }
	| {
			type: 'homeWallpaperSetting';
			playerId: string;
	  }
	| {
			type: 'profileCardSetting';
			playerId: string;
	  };

export type MissionProgressPlan = {
	playerId: string;
	commonTransitionId?: number | undefined;
	beginnerTransitionId?: number | undefined;
	dailyMissionGameDate?: string | undefined;
	schoolStageStarTotal?: number | undefined;
	rhythmGameStarTotal?: number | undefined;
};

export function createMissionProgressPlan(
	event: MissionProgressEvent,
	isStandardQuestProgressCompatible: (
		progress: UserQuestStageProgressState,
	) => boolean = () => true,
): MissionProgressPlan {
	switch (event.type) {
		case 'questClear':
			return createQuestClearMissionProgressPlan(
				event,
				isStandardQuestProgressCompatible,
			);
		case 'rhythmGameClear':
			return {
				playerId: event.playerId,
				commonTransitionId: rhythmGameClearTransitionId,
				rhythmGameStarTotal: event.userLive
					? calculateRhythmGameStarTotal(event.userLive)
					: undefined,
			};
		case 'homeWallpaperSetting':
			return {
				playerId: event.playerId,
				beginnerTransitionId: homeWallpaperSettingTransitionId,
			};
		case 'profileCardSetting':
			return {
				playerId: event.playerId,
				beginnerTransitionId: profileCardSettingTransitionId,
			};
	}
}

function createQuestClearMissionProgressPlan(
	event: Extract<MissionProgressEvent, { type: 'questClear' }>,
	isStandardQuestProgressCompatible: (
		progress: UserQuestStageProgressState,
	) => boolean,
): MissionProgressPlan {
	return {
		playerId: event.playerId,
		commonTransitionId: getCommonQuestClearTransitionId(event.questLiveType),
		beginnerTransitionId: event.isSkip
			? undefined
			: getBeginnerQuestClearTransitionId(event.questLiveType),
		dailyMissionGameDate: event.gameDate,
		schoolStageStarTotal:
			event.userLive && event.questLiveType === 1 && !event.isSkip
				? calculateStandardQuestStarTotal(
						event.userLive,
						isStandardQuestProgressCompatible,
					)
				: undefined,
	};
}

function getCommonQuestClearTransitionId(
	questLiveType: number,
): number | undefined {
	switch (questLiveType) {
		case 1:
			return standardQuestClearTransitionId;
		case 2:
			return dailyQuestClearTransitionId;
		case 5:
			return dreamQuestClearTransitionId;
		default:
			return undefined;
	}
}

function getBeginnerQuestClearTransitionId(
	questLiveType: number,
): number | undefined {
	switch (questLiveType) {
		case 1:
			return questLiveClearTransitionId;
		case 2:
			return dailyQuestClearTransitionId;
		default:
			return undefined;
	}
}
