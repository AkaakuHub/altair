import type { MemberFanLevelDefinition } from './member-fan-level-definition.ts';
import {
	mergeSeasonMemberFanLevelProgresses,
	projectCurrentSeasonMemberFanLevels,
} from './season-fan-level-member-projection.ts';
import type {
	MemberFanLevelState,
	SeasonFanLevelState,
	UserStatusState,
} from './user-status-types.ts';

export function ensureCurrentSeasonFanLevel(
	status: UserStatusState,
): SeasonFanLevelState {
	if (!Array.isArray(status.seasonFanLevels))
		throw new Error('user status season fan levels are not migrated');
	const current = status.seasonFanLevels.find(
		(season) => season.seasonId === status.seasonFanLevelSeasonId,
	);
	if (current !== undefined) {
		status.seasonFanLevelPointStock = current.pointStock;
		status.seasonFanLevelPointStockLimit = current.pointStockLimit;
		return current;
	}
	const created = {
		seasonId: status.seasonFanLevelSeasonId,
		pointStock: 0,
		pointStockLimit: 0,
		memberFanLevels: [],
	};
	status.seasonFanLevels.push(created);
	status.seasonFanLevelPointStock = 0;
	status.seasonFanLevelPointStockLimit = 0;
	return created;
}

export function getCurrentSeasonMemberFanLevels(
	status: UserStatusState,
	definitions: readonly MemberFanLevelDefinition[],
): MemberFanLevelState[] {
	return projectCurrentSeasonMemberFanLevels(
		status.memberFanLevels,
		ensureCurrentSeasonFanLevel(status),
		definitions,
	);
}
export function getCurrentSeasonFanLevelPointStock(status: UserStatusState) {
	const current = ensureCurrentSeasonFanLevel(status);
	return {
		pointStock: current.pointStock,
		pointStockLimit: current.pointStockLimit,
	};
}
export function setCurrentSeasonFanLevelState(
	status: UserStatusState,
	values: {
		pointStock: number;
		pointStockLimit: number;
		memberFanLevels: readonly MemberFanLevelState[];
	},
	definitions: readonly MemberFanLevelDefinition[],
): void {
	const current = ensureCurrentSeasonFanLevel(status);
	current.pointStock = values.pointStock;
	current.pointStockLimit = values.pointStockLimit;
	current.memberFanLevels = mergeSeasonMemberFanLevelProgresses(
		current.memberFanLevels,
		values.memberFanLevels,
		definitions,
	);
	status.seasonFanLevelPointStock = current.pointStock;
	status.seasonFanLevelPointStockLimit = current.pointStockLimit;
}
