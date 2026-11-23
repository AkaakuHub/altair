import type {
	FanLevelEarnProgressState,
	MemberFanLevelState,
} from '../../state/user-status-types.ts';
import type {
	EarnProgress,
	FanLevelInfo,
	SeasonFanLevelInfo,
} from './profile-fan-level-response-types.ts';

export function createFanLevelInfo(
	memberFanLevel: MemberFanLevelState,
	earnProgresses: readonly FanLevelEarnProgressState[],
): FanLevelInfo {
	return {
		character_id: memberFanLevel.characterId,
		d_season_fan_level: memberFanLevel.dSeasonFanLevel,
		d_season_fan_experience: memberFanLevel.dSeasonFanExperience,
		member_fan_level: memberFanLevel.memberFanLevel,
		member_fan_experience: memberFanLevel.memberFanExperience,
		earn_progress_list: earnProgresses.map(createEarnProgress),
	};
}

export function createSeasonFanLevelInfo(
	memberFanLevel: MemberFanLevelState,
): SeasonFanLevelInfo {
	return {
		characters_id: memberFanLevel.characterId,
		d_season_fan_level: memberFanLevel.dSeasonFanLevel,
		d_season_fan_experience: memberFanLevel.dSeasonFanExperience,
		grade: 0,
	};
}

function createEarnProgress(progress: FanLevelEarnProgressState): EarnProgress {
	return {
		earn_type: progress.earnType,
		total_point: progress.totalPoint,
		season_point_history_list: progress.seasonPointHistoryList.map(
			(seasonHistory) => ({
				season_id: seasonHistory.seasonId,
				point_history_list: seasonHistory.pointHistoryList.map(
					(pointHistory) => ({ ...pointHistory }),
				),
			}),
		),
	};
}
