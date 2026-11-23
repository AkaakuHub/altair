import type { Database } from 'bun:sqlite';
import { applyArchiveGiftProgressToArchiveList } from '../../application/archive-catalog-progress.ts';
import { getGiftLiveIdentityFingerprint } from '../../master-data/archive-identity.ts';
import type { ArchiveGiftPointState } from '../../state/archive-gift-state.ts';
import type { ArchivePrizeMaster } from '../../state/archive-prize-definition.ts';
import type { JsonObject } from '../../state/json-state-utils.ts';

export function projectArchiveGiftProgress<T extends JsonObject>(
	database: Database,
	archives: T[],
	archiveGiftPoints: readonly ArchiveGiftPointState[],
	playerId: string,
	findPrizeMaster: (archiveId: string) => ArchivePrizeMaster | undefined,
): T[] {
	return applyArchiveGiftProgressToArchiveList(
		archives,
		archiveGiftPoints,
		playerId,
		findPrizeMaster,
		(archiveId) =>
			getGiftLiveIdentityFingerprint(database, 'withlive', archiveId),
	);
}
