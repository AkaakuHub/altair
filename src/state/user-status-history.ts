import type {
	FanLevelEarnProgressState,
	SeasonFanLevelState,
} from './user-status-types.ts';
import { isFanLevelEarnProgressState } from './user-status-validator.ts';

export function cloneSeasonFanLevels(
	seasonFanLevels: readonly SeasonFanLevelState[],
): SeasonFanLevelState[] {
	return seasonFanLevels.map((seasonFanLevel) => ({
		seasonId: seasonFanLevel.seasonId,
		pointStock: seasonFanLevel.pointStock,
		pointStockLimit: seasonFanLevel.pointStockLimit,
		memberFanLevels: seasonFanLevel.memberFanLevels.map((memberFanLevel) => ({
			...memberFanLevel,
		})),
	}));
}

export function normalizeFanLevelEarnProgresses(
	progresses: FanLevelEarnProgressState[],
): FanLevelEarnProgressState[] {
	return progresses
		.filter(isFanLevelEarnProgressState)
		.map(cloneFanLevelEarnProgress);
}

export function cloneFanLevelEarnProgresses(
	progresses: FanLevelEarnProgressState[],
): FanLevelEarnProgressState[] {
	return progresses.map(cloneFanLevelEarnProgress);
}

export function cloneFanLevelEarnProgress(
	progress: FanLevelEarnProgressState,
): FanLevelEarnProgressState {
	return {
		characterId: progress.characterId,
		earnType: progress.earnType,
		totalPoint: progress.totalPoint,
		seasonPointHistoryList: progress.seasonPointHistoryList.map(
			(seasonHistory) => ({
				seasonId: seasonHistory.seasonId,
				pointHistoryList: seasonHistory.pointHistoryList.map(
					(pointHistory) => ({
						...pointHistory,
					}),
				),
			}),
		),
	};
}
