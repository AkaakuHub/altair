import { normalizeSeasonFanLevel } from './fan-level-normalization.ts';
import type {
	MemberFanLevelDefinition,
	SeasonFanLevelBoundary,
} from './member-fan-level-definition.ts';
import {
	getCurrentSeasonFanLevelPointStock,
	getCurrentSeasonMemberFanLevels,
	setCurrentSeasonFanLevelState,
} from './season-fan-level-current-aggregate.ts';
import type {
	MemberFanLevelState,
	UserStatusState,
} from './user-status-types.ts';

export type UseSeasonFanLevelPointStock = {
	charactersId: number;
	useStock: number;
};

type SeasonFanLevelPointStockResult =
	| { result: 'applied' }
	| { result: 'invalidRequest' }
	| { result: 'insufficientStock' };

type SeasonFanLevelPointStockApplication = {
	memberFanLevel: MemberFanLevelState;
	normalized: MemberFanLevelState;
};

export function applySeasonFanLevelPointStocks(
	status: UserStatusState,
	useStockList: readonly UseSeasonFanLevelPointStock[],
	seasonFanLevelTable: readonly SeasonFanLevelBoundary[],
	memberFanLevelDefinitions: readonly MemberFanLevelDefinition[],
): SeasonFanLevelPointStockResult {
	if (!isValidUseStockList(useStockList)) {
		return { result: 'invalidRequest' };
	}
	const totalUseStock = useStockList.reduce(
		(total, stock) => total + stock.useStock,
		0,
	);
	if (!Number.isSafeInteger(totalUseStock)) {
		return { result: 'invalidRequest' };
	}
	const currentStock = getCurrentSeasonFanLevelPointStock(status);
	if (totalUseStock > currentStock.pointStock) {
		return { result: 'insufficientStock' };
	}
	const currentMemberFanLevels = getCurrentSeasonMemberFanLevels(
		status,
		memberFanLevelDefinitions,
	);
	const memberFanLevelByCharacterId = new Map(
		currentMemberFanLevels.map((memberFanLevel) => [
			memberFanLevel.characterId,
			memberFanLevel,
		]),
	);
	if (
		useStockList.some(
			(stock) => !memberFanLevelByCharacterId.has(stock.charactersId),
		)
	) {
		return { result: 'invalidRequest' };
	}
	const applications: SeasonFanLevelPointStockApplication[] = [];
	for (const stock of useStockList) {
		const memberFanLevel = memberFanLevelByCharacterId.get(stock.charactersId);
		if (memberFanLevel === undefined) {
			return { result: 'invalidRequest' };
		}
		if (
			isMaxSeasonFanLevel(
				memberFanLevel,
				status.seasonFanLevelSeasonId,
				seasonFanLevelTable,
			)
		) {
			return { result: 'invalidRequest' };
		}
		const normalized = normalizeSeasonFanLevel(
			memberFanLevel,
			{
				dSeasonFanExperience:
					memberFanLevel.dSeasonFanExperience + stock.useStock,
			},
			status.seasonFanLevelSeasonId,
			seasonFanLevelTable,
		);
		applications.push({ memberFanLevel, normalized });
	}
	for (const application of applications) {
		application.memberFanLevel.dSeasonFanLevel =
			application.normalized.dSeasonFanLevel;
		application.memberFanLevel.dSeasonFanExperience =
			application.normalized.dSeasonFanExperience;
	}
	setCurrentSeasonFanLevelState(
		status,
		{
			pointStock: currentStock.pointStock - totalUseStock,
			pointStockLimit: currentStock.pointStockLimit,
			memberFanLevels: currentMemberFanLevels,
		},
		memberFanLevelDefinitions,
	);
	return { result: 'applied' };
}

function isMaxSeasonFanLevel(
	memberFanLevel: MemberFanLevelState,
	seasonId: number,
	seasonFanLevelTable: readonly SeasonFanLevelBoundary[],
): boolean {
	const maxLevel = seasonFanLevelTable
		.filter((boundary) => boundary.seasonId === seasonId)
		.at(-1)?.level;
	return maxLevel !== undefined && memberFanLevel.dSeasonFanLevel >= maxLevel;
}

function isValidUseStockList(
	useStockList: readonly UseSeasonFanLevelPointStock[],
): boolean {
	return useStockList.every(
		(stock) =>
			Number.isSafeInteger(stock.charactersId) &&
			Number.isSafeInteger(stock.useStock) &&
			stock.useStock > 0,
	);
}
