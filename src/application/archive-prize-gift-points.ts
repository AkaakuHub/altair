import type { ServerState } from '../server-state-schema.ts';
import {
	addArchiveGiftPoint,
	addAwardedArchivePrizeStars,
	findArchiveGiftPoint,
	getArchiveGiftPointWithDefaults,
	setArchiveGiftPoint,
} from '../state/archive-gift-state.ts';
import type { ArchivePrizeMaster } from '../state/archive-prize-definition.ts';
import type { EntityProvenance } from '../state/entity-provenance.ts';
import type { UserPresentBoxState } from '../state/user-presents-state.ts';
import {
	ensureArchivePrizePresent,
	ensureWithstationPrizePresent,
	findWithstationPrizePresent,
	syncArchivePrizePresents,
} from './archive-prize-presents.ts';
import {
	countEarnedArchiveStars,
	getAllocatedArchivePrizeStarCount,
} from './archive-prize-progress.ts';

export function addArchiveGiftPointAndPrizePresents(
	state: ServerState,
	presentBox: UserPresentBoxState,
	playerId: string,
	liveId: string,
	userGiftPoint: number,
	master: ArchivePrizeMaster,
	liveProvenance: EntityProvenance,
	rewardProvenance: EntityProvenance,
): { totalUserGiftPoint: number } {
	const result = addArchiveGiftPoint(
		state.archiveGiftPoints,
		playerId,
		liveId,
		userGiftPoint,
		true,
		liveProvenance,
	);
	state.archiveGiftPoints = result.giftPoints;
	const previousStarCount = countEarnedArchiveStars(
		master.giftStarRewardSegments,
		result.previousTotalUserGiftPoint,
	);
	const currentStarCount = countEarnedArchiveStars(
		master.giftStarRewardSegments,
		result.point.totalUserGiftPoint,
	);
	const newStarCount = Math.max(0, currentStarCount - previousStarCount);
	if (newStarCount > 0) {
		addAwardedArchivePrizeStars(result.point, newStarCount);
		ensureArchivePrizePresent(presentBox, master, rewardProvenance);
	}
	return { totalUserGiftPoint: result.point.totalUserGiftPoint };
}

export function addWithstationGiftPointAndPrizePresents(
	state: ServerState,
	presentBox: UserPresentBoxState,
	playerId: string,
	liveId: string,
	userGiftPoint: number,
	master: ArchivePrizeMaster,
	liveProvenance: EntityProvenance,
	rewardProvenance: EntityProvenance,
): { totalUserGiftPoint: number } {
	const result = addArchiveGiftPoint(
		state.archiveGiftPoints,
		playerId,
		liveId,
		userGiftPoint,
		false,
		liveProvenance,
	);
	state.archiveGiftPoints = result.giftPoints;
	const currentUserGiftPointWithoutArchive =
		result.point.totalUserGiftPointWithoutArchive;
	const previousStarCount = countEarnedArchiveStars(
		master.giftStarRewardSegments,
		currentUserGiftPointWithoutArchive - userGiftPoint,
	);
	const currentStarCount = countEarnedArchiveStars(
		master.giftStarRewardSegments,
		currentUserGiftPointWithoutArchive,
	);
	const newStarCount = Math.max(0, currentStarCount - previousStarCount);
	if (newStarCount > 0) {
		addAwardedArchivePrizeStars(result.point, newStarCount);
		ensureWithstationPrizePresent(presentBox, master, rewardProvenance);
	}
	return { totalUserGiftPoint: result.point.totalUserGiftPoint };
}

export function setArchiveGiftPointAndPrizePresents(
	state: ServerState,
	presentBox: UserPresentBoxState,
	playerId: string,
	liveId: string,
	totalUserGiftPoint: number,
	totalUserGiftPointWithoutArchive: number,
	master: ArchivePrizeMaster,
	liveProvenance: EntityProvenance,
	rewardProvenance: EntityProvenance,
): void {
	const awardedArchivePrizeStarCount = countEarnedArchiveStars(
		master.giftStarRewardSegments,
		totalUserGiftPoint,
	);
	const currentPoint = findArchiveGiftPoint(
		state.archiveGiftPoints,
		playerId,
		liveId,
		liveProvenance.identityFingerprint,
	);
	const allocatedArchivePrizeStarCount = Math.min(
		getAllocatedArchivePrizeStarCount(currentPoint),
		awardedArchivePrizeStarCount,
	);
	state.archiveGiftPoints = setArchiveGiftPoint(state.archiveGiftPoints, {
		playerId,
		liveId,
		totalUserGiftPoint,
		totalUserGiftPointWithoutArchive,
		awardedArchivePrizeStarCount,
		allocatedArchivePrizeStarCount,
		...liveProvenance,
	});
	syncArchivePrizePresents(
		presentBox,
		master,
		awardedArchivePrizeStarCount - allocatedArchivePrizeStarCount,
		rewardProvenance,
	);
}

export function ensureArchivePlaybackPrize(
	state: ServerState,
	presentBox: UserPresentBoxState,
	playerId: string,
	master: ArchivePrizeMaster,
	liveProvenance: EntityProvenance,
	rewardProvenance: EntityProvenance,
): boolean {
	let giftPoint = findArchiveGiftPoint(
		state.archiveGiftPoints,
		playerId,
		master.liveId,
		liveProvenance.identityFingerprint,
	);
	if (!giftPoint) {
		giftPoint = {
			playerId,
			liveId: master.liveId,
			totalUserGiftPoint: 0,
			totalUserGiftPointWithoutArchive: 0,
			awardedArchivePrizeStarCount: 0,
			allocatedArchivePrizeStarCount: 0,
			...liveProvenance,
		};
		state.archiveGiftPoints = setArchiveGiftPoint(
			state.archiveGiftPoints,
			giftPoint,
		);
	}
	if (
		getArchiveGiftPointWithDefaults(giftPoint).awardedArchivePrizeStarCount > 0
	) {
		return false;
	}
	addAwardedArchivePrizeStars(giftPoint, 1);
	ensureWithstationPrizePresent(presentBox, master, rewardProvenance);
	const present = findWithstationPrizePresent(
		presentBox,
		master.liveId,
		rewardProvenance.identityFingerprint,
	);
	if (present === undefined)
		throw new Error('WithSTATION playback prize present missing');
	present.withstationPlaybackReward = true;
	return true;
}
