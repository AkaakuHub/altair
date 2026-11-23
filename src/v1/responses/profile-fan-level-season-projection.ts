import type { UserStatusController } from '../../application/user-status-controller.ts';
import type {
	FanLevelEarnProgressState,
	MemberFanLevelState,
	UserStatusState,
} from '../../state/user-status-types.ts';
import {
	createFanLevelInfo,
	createSeasonFanLevelInfo,
} from './profile-fan-level-mapper.ts';
import type {
	FanLevelInfoResponse,
	ProfileUseFanLevelPointStocksResponse,
} from './profile-fan-level-response-types.ts';

export function createFanLevelInfoResponse(
	status: UserStatusState,
	memberFanLevels: readonly MemberFanLevelState[],
	userStatus: UserStatusController,
	earnProgressesByCharacterId: ReadonlyMap<
		number,
		readonly FanLevelEarnProgressState[]
	> = new Map(),
): FanLevelInfoResponse {
	const stock = userStatus.getCurrentSeasonFanLevelPointStock(status);
	return {
		season_id: status.seasonFanLevelSeasonId,
		season_fanlevel_point_stock: stock.pointStock,
		season_fanlevel_point_stock_limit: stock.pointStockLimit,
		fan_level_info_list: memberFanLevels.map((member) =>
			createFanLevelInfo(
				member,
				earnProgressesByCharacterId.get(member.characterId) ?? [],
			),
		),
	};
}

export function createUseFanLevelPointStocksResponse(
	status: UserStatusState,
	memberFanLevels: readonly MemberFanLevelState[],
	userStatus: UserStatusController,
): ProfileUseFanLevelPointStocksResponse {
	const stock = userStatus.getCurrentSeasonFanLevelPointStock(status);
	return {
		season_fan_level_info_list: memberFanLevels.map(createSeasonFanLevelInfo),
		season_fanlevel_point_stock: stock.pointStock,
		season_fanlevel_point_stock_limit: stock.pointStockLimit,
	};
}
