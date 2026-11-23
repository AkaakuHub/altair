import type { ServerState } from '../server-state-schema.ts';
import {
	addAllocatedArchivePrizeStars,
	findArchiveGiftPoint,
	getArchiveGiftPointWithDefaults,
} from '../state/archive-gift-state.ts';
import type { EntityIdentityFingerprint } from '../state/entity-provenance.ts';
import type { MemberFanLevelBoundary } from '../state/member-fan-level-definition.ts';
import {
	type PresentBoxItem,
	receivePresentBoxItem,
	type UserPresentBoxState,
} from '../state/user-presents-state.ts';
import {
	isArchivePrizePresent,
	isWithstationPrizePresent,
} from './archive-prize-presents.ts';
import { countPendingArchivePrizeStars } from './archive-prize-progress.ts';
import {
	MEMBER_EXP_PER_ARCHIVE_STAR,
	WITHSTATION_PRIZE_SISCA,
} from './archive-prize-types.ts';
import {
	areValidPrizeStarAllocations,
	type PrizeStarAllocation,
} from './prize-star-allocations.ts';
import type { UserStatusController } from './user-status-controller.ts';

export function allocateArchivePrizeStars(
	state: ServerState,
	playerId: string,
	presentBox: UserPresentBoxState,
	presentBoxId: string,
	allocations: readonly PrizeStarAllocation[],
	userStatus: UserStatusController,
	memberFanLevelTable: readonly MemberFanLevelBoundary[],
	targetFingerprint: EntityIdentityFingerprint | undefined,
): boolean {
	return allocatePrizeStars(
		state,
		playerId,
		presentBox,
		presentBoxId,
		allocations,
		userStatus,
		memberFanLevelTable,
		isArchivePrizePresent,
		targetFingerprint,
	);
}

export function allocateWithstationPrizeStars(
	state: ServerState,
	playerId: string,
	presentBox: UserPresentBoxState,
	presentBoxId: string,
	allocations: readonly PrizeStarAllocation[],
	userStatus: UserStatusController,
	memberFanLevelTable: readonly MemberFanLevelBoundary[],
	targetFingerprint: EntityIdentityFingerprint,
	characterIds: readonly number[],
): boolean {
	if (
		presentBox.playerId !== playerId ||
		allocations.some(
			(allocation) => !characterIds.includes(allocation.characterId),
		)
	) {
		return false;
	}
	const isPlaybackReward = presentBox.presentList.some(
		(present) =>
			present.d_present_boxes_id === presentBoxId &&
			present.withstationPlaybackReward === true,
	);
	const allocated = allocatePrizeStars(
		state,
		playerId,
		presentBox,
		presentBoxId,
		allocations,
		userStatus,
		memberFanLevelTable,
		isWithstationPrizePresent,
		targetFingerprint,
	);
	if (allocated && isPlaybackReward)
		userStatus.ensure(state, playerId).value.jewelFree +=
			WITHSTATION_PRIZE_SISCA;
	return allocated;
}

function allocatePrizeStars(
	state: ServerState,
	playerId: string,
	presentBox: UserPresentBoxState,
	presentBoxId: string,
	allocations: readonly PrizeStarAllocation[],
	userStatus: UserStatusController,
	memberFanLevelTable: readonly MemberFanLevelBoundary[],
	isPrizePresent: (
		present: PresentBoxItem | undefined,
	) => present is PresentBoxItem,
	targetFingerprint: EntityIdentityFingerprint | undefined,
): boolean {
	const present = presentBox.presentList.find(
		(item) => item.d_present_boxes_id === presentBoxId,
	);
	if (!isPrizePresent(present) || !areValidPrizeStarAllocations(allocations)) {
		return false;
	}
	const allocatedStarCount = allocations.reduce(
		(sum, allocation) => sum + allocation.starNum,
		0,
	);
	const giftPoint = findArchiveGiftPoint(
		state.archiveGiftPoints,
		playerId,
		present.live_id,
		targetFingerprint,
	);
	if (!giftPoint) return false;
	const pendingStarCount = countPendingArchivePrizeStars(
		getArchiveGiftPointWithDefaults(giftPoint),
	);
	if (pendingStarCount <= 0 || allocatedStarCount !== pendingStarCount) {
		return false;
	}
	const status = userStatus.ensure(state, playerId).value;
	for (const allocation of allocations) {
		userStatus.addMemberFanExperience(
			status,
			allocation.characterId,
			allocation.starNum * MEMBER_EXP_PER_ARCHIVE_STAR,
			memberFanLevelTable,
		);
	}
	addAllocatedArchivePrizeStars(giftPoint, allocatedStarCount);
	return receivePresentBoxItem(presentBox, presentBoxId) !== undefined;
}
