import type { MemberFanLevelDefinition } from './member-fan-level-definition.ts';
import { ensureCurrentSeasonFanLevel } from './season-fan-level-current-aggregate.ts';
import {
	compactMemberFanLevels,
	compactSeasonMemberFanLevels,
} from './season-fan-level-member-projection.ts';
import type { UserStatusState } from './user-status-types.ts';

export function migrateUserStatusSeasonFanLevels(
	status: UserStatusState,
	definitions: readonly MemberFanLevelDefinition[],
): void {
	status.memberFanLevels = compactMemberFanLevels(
		status.memberFanLevels,
		definitions,
	);
	if (!Array.isArray(status.seasonFanLevels)) status.seasonFanLevels = [];
	for (const season of status.seasonFanLevels)
		season.memberFanLevels = compactSeasonMemberFanLevels(
			season.memberFanLevels,
			definitions,
		);
	if (
		!status.seasonFanLevels.some(
			(season) => season.seasonId === status.seasonFanLevelSeasonId,
		)
	) {
		status.seasonFanLevels.push({
			seasonId: status.seasonFanLevelSeasonId,
			pointStock: status.seasonFanLevelPointStock,
			pointStockLimit: status.seasonFanLevelPointStockLimit,
			memberFanLevels: status.memberFanLevels.map((progress) => ({
				characterId: progress.characterId,
				dSeasonFanLevel: progress.dSeasonFanLevel,
				dSeasonFanExperience: progress.dSeasonFanExperience,
			})),
		});
	}
	ensureCurrentSeasonFanLevel(status);
}
