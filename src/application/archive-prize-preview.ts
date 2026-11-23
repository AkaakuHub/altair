import type { ServerState } from '../server-state-schema.ts';
import {
	findArchiveGiftPoint,
	getArchiveGiftPointWithDefaults,
} from '../state/archive-gift-state.ts';
import type { ArchivePrizeMaster } from '../state/archive-prize-definition.ts';
import type { EntityIdentityFingerprint } from '../state/entity-provenance.ts';
import type { PresentBoxItem } from '../state/user-presents-state.ts';
import { isPrizeStarPresent } from './archive-prize-presents.ts';
import { countPendingArchivePrizeStars } from './archive-prize-progress.ts';
import {
	type ArchivePrizePreview,
	MEMBER_EXP_PER_ARCHIVE_STAR,
} from './archive-prize-types.ts';
import type { UserStatusController } from './user-status-controller.ts';

export function createArchivePrizePreview(
	state: ServerState,
	playerId: string,
	present: PresentBoxItem,
	master: ArchivePrizeMaster | undefined,
	targetFingerprint: EntityIdentityFingerprint | undefined,
	userStatus: UserStatusController,
): ArchivePrizePreview | undefined {
	if (
		!isPrizeStarPresent(present) ||
		!master ||
		master.liveId !== present.live_id
	) {
		return undefined;
	}
	const giftPoint = findArchiveGiftPoint(
		state.archiveGiftPoints,
		playerId,
		present.live_id,
		targetFingerprint,
	);
	if (!giftPoint) {
		return undefined;
	}
	const point = getArchiveGiftPointWithDefaults(giftPoint);
	const pendingStarCount = countPendingArchivePrizeStars(point);
	if (pendingStarCount <= 0) {
		return undefined;
	}
	const status = userStatus.ensure(state, playerId).value;
	const currentSeasonFanLevelPointStock =
		userStatus.getCurrentSeasonFanLevelPointStock(status);
	const currentSeasonMemberFanLevels =
		userStatus.getCurrentSeasonMemberFanLevels(status);
	const memberFanLevels = userStatus.getMemberFanLevels(status);
	return {
		liveId: present.live_id,
		userGiftPoint: point.totalUserGiftPoint,
		userGiftPointWithoutArchive: point.totalUserGiftPointWithoutArchive,
		starNum: pendingStarCount,
		memberExpPerStar: MEMBER_EXP_PER_ARCHIVE_STAR,
		characters: master.characterIds.map((characterId) => {
			const memberFanLevel = memberFanLevels.find(
				(level) => level.characterId === characterId,
			);
			const seasonMemberFanLevel = currentSeasonMemberFanLevels.find(
				(level) => level.characterId === characterId,
			);
			return {
				characterId,
				beforeLevel: memberFanLevel?.memberFanLevel ?? 1,
				beforeExperience: memberFanLevel?.memberFanExperience ?? 0,
				seasonBeforeLevel: seasonMemberFanLevel?.dSeasonFanLevel ?? 1,
				seasonBeforeExperience: seasonMemberFanLevel?.dSeasonFanExperience ?? 0,
			};
		}),
		seasonId: status.seasonFanLevelSeasonId,
		seasonFanLevelPointStock: currentSeasonFanLevelPointStock.pointStock,
		seasonFanLevelPointStockLimit:
			currentSeasonFanLevelPointStock.pointStockLimit,
	};
}
