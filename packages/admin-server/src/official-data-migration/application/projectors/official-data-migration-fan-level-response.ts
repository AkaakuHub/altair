import type {
	FanLevelEarnProgressState,
	FanLevelSeasonPointHistoryState,
	MemberFanLevelState,
	SeasonFanLevelState,
	UserStatusState,
} from '../../../../../../src/state/user-status-types.ts';
import {
	type JsonRecord,
	readNumber,
	readRecordArray,
	readString,
} from '../official-data-migration-dump.ts';

export function applyFanLevelInfoResponse(
	status: UserStatusState,
	response: JsonRecord,
): void {
	status.seasonFanLevelSeasonId = readNumber(response.season_id) ?? 0;
	status.seasonFanLevelPointStock =
		readNumber(response.season_fanlevel_point_stock) ?? 0;
	status.seasonFanLevelPointStockLimit =
		readNumber(response.season_fanlevel_point_stock_limit) ?? 0;
	status.memberFanLevels = readRecordArray(response.fan_level_info_list)
		.map(createMemberFanLevel)
		.filter((entry): entry is MemberFanLevelState => entry !== null);
	status.fanLevelEarnProgresses = readRecordArray(
		response.fan_level_info_list,
	).flatMap(createFanLevelEarnProgresses);
	status.seasonFanLevels =
		status.seasonFanLevelSeasonId > 0
			? [createCurrentSeasonFanLevel(status)]
			: [];
}

function createMemberFanLevel(entry: JsonRecord): MemberFanLevelState | null {
	const characterId = readNumber(entry.character_id);
	const dSeasonFanLevel = readNumber(entry.d_season_fan_level);
	const dSeasonFanExperience = readNumber(entry.d_season_fan_experience);
	const memberFanLevel = readNumber(entry.member_fan_level);
	const memberFanExperience = readNumber(entry.member_fan_experience);
	if (
		characterId === null ||
		dSeasonFanLevel === null ||
		dSeasonFanExperience === null ||
		memberFanLevel === null ||
		memberFanExperience === null
	) {
		return null;
	}
	return {
		characterId,
		dSeasonFanLevel,
		dSeasonFanExperience,
		memberFanLevel,
		memberFanExperience,
	};
}

function createFanLevelEarnProgresses(
	entry: JsonRecord,
): FanLevelEarnProgressState[] {
	const characterId = readNumber(entry.character_id);
	if (characterId === null) {
		return [];
	}
	return readRecordArray(entry.earn_progress_list)
		.map((progress) => createFanLevelEarnProgress(characterId, progress))
		.filter(
			(progress): progress is FanLevelEarnProgressState => progress !== null,
		);
}

function createFanLevelEarnProgress(
	characterId: number,
	progress: JsonRecord,
): FanLevelEarnProgressState | null {
	const earnType = readNumber(progress.earn_type);
	const totalPoint = readNumber(progress.total_point);
	if (earnType === null || totalPoint === null) {
		return null;
	}
	return {
		characterId,
		earnType,
		totalPoint,
		seasonPointHistoryList: readRecordArray(progress.season_point_history_list)
			.map(createSeasonPointHistory)
			.filter(
				(history): history is FanLevelSeasonPointHistoryState =>
					history !== null,
			),
	};
}

function createSeasonPointHistory(
	history: JsonRecord,
): FanLevelSeasonPointHistoryState | null {
	const seasonId = readNumber(history.season_id);
	if (seasonId === null) {
		return null;
	}
	return {
		seasonId,
		pointHistoryList: readRecordArray(history.point_history_list)
			.map(createPointHistory)
			.filter(
				(entry): entry is { date: string; message: string; point: number } =>
					entry !== null,
			),
	};
}

function createPointHistory(
	entry: JsonRecord,
): { date: string; message: string; point: number } | null {
	const date = readString(entry.date);
	const point = readNumber(entry.point);
	if (date === null || point === null) {
		return null;
	}
	return {
		date,
		message: typeof entry.message === 'string' ? entry.message : '',
		point,
	};
}

function createCurrentSeasonFanLevel(
	status: UserStatusState,
): SeasonFanLevelState {
	return {
		seasonId: status.seasonFanLevelSeasonId,
		pointStock: status.seasonFanLevelPointStock,
		pointStockLimit: status.seasonFanLevelPointStockLimit,
		memberFanLevels: status.memberFanLevels.map((memberFanLevel) => ({
			characterId: memberFanLevel.characterId,
			dSeasonFanLevel: memberFanLevel.dSeasonFanLevel,
			dSeasonFanExperience: memberFanLevel.dSeasonFanExperience,
		})),
	};
}
