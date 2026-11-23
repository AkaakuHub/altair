import type { Database } from 'bun:sqlite';
import type { ActiveMasterSelection } from '../master-data/active-master-repository.ts';
import type { ResourceVersionPlatform } from '../resource-versions.ts';

export function createMasterSelectionResolvers(
	selection: ActiveMasterSelection,
	resolvePlatform: (playerId?: string) => ResourceVersionPlatform | undefined,
) {
	const resolveSelection = (
		playerId?: string,
	): Readonly<{ masterReleaseId: string; database: Database }> => {
		if (selection.platforms !== undefined)
			return selection.platforms[resolvePlatform(playerId) ?? 'android'];
		return {
			masterReleaseId: selection.releaseId,
			database: selection.database,
		};
	};
	return {
		resolveCurrent: () => resolveSelection().database,
		resolveUser: (playerId?: string) => resolveSelection(playerId).database,
		resolveAdminUserSelection: resolveSelection,
		resolveAdminUser: (playerId?: string) =>
			resolveSelection(playerId).database,
		resolveSelectedAdminUser: () => resolveSelection().database,
		resolveActiveRelease: (releaseId: string): Database => {
			if (releaseId === selection.releaseId) return selection.database;
			const platform =
				selection.platforms === undefined
					? undefined
					: Object.values(selection.platforms).find(
							(entry) => entry.masterReleaseId === releaseId,
						);
			if (platform === undefined)
				throw new Error(`active master release differs: ${releaseId}`);
			return platform.database;
		},
	};
}

export type MasterSelectionResolvers = ReturnType<
	typeof createMasterSelectionResolvers
>;
