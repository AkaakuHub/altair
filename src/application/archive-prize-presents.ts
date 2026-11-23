import type { ArchivePrizeMaster } from '../state/archive-prize-definition.ts';
import {
	type EntityIdentityFingerprint,
	type EntityProvenance,
	isSameEntityIdentity,
} from '../state/entity-provenance.ts';
import {
	addPresentBoxItem,
	type PresentBoxItem,
	type UserPresentBoxState,
} from '../state/user-presents-state.ts';

const ARCHIVE_WITHLIVE_STAR_ITEM_ID = 2016001;
const WITHSTATION_STAR_ITEM_ID = 2017001;

export function findArchivePrizePresent(
	presentBox: UserPresentBoxState,
	presentBoxId: string,
): PresentBoxItem | undefined {
	return presentBox.presentList.find(
		(item) =>
			item.d_present_boxes_id === presentBoxId && isArchivePrizePresent(item),
	);
}

export function findFirstArchivePrizePresent(
	presentBox: UserPresentBoxState,
): PresentBoxItem | undefined {
	return presentBox.presentList.find(isArchivePrizePresent);
}

export function findWithstationPrizePresent(
	presentBox: UserPresentBoxState,
	liveId: string,
	targetFingerprint: EntityIdentityFingerprint,
): PresentBoxItem | undefined {
	return presentBox.presentList.find(
		(item) =>
			isWithstationPrizePresent(item) &&
			item.live_id === liveId &&
			isSameEntityIdentity(
				item.rewardProvenance?.identityFingerprint,
				targetFingerprint,
			),
	);
}

export function isArchivePrizePresent(
	present: PresentBoxItem | undefined,
): present is PresentBoxItem {
	return (
		present !== undefined &&
		present.item_id === ARCHIVE_WITHLIVE_STAR_ITEM_ID &&
		present.live_id.length > 0
	);
}

export function isWithstationPrizePresent(
	present: PresentBoxItem | undefined,
): present is PresentBoxItem {
	return (
		present !== undefined &&
		present.item_id === WITHSTATION_STAR_ITEM_ID &&
		present.live_id.length > 0
	);
}

export function isPrizeStarPresent(
	present: PresentBoxItem | undefined,
): present is PresentBoxItem {
	return isArchivePrizePresent(present) || isWithstationPrizePresent(present);
}

export function ensureArchivePrizePresent(
	presentBox: UserPresentBoxState,
	master: ArchivePrizeMaster,
	provenance: EntityProvenance,
): void {
	const hasPendingPresent = presentBox.presentList.some(
		(present) =>
			isArchivePrizePresent(present) && present.live_id === master.liveId,
	);
	if (!hasPendingPresent) {
		addArchivePrizePresent(presentBox, master, provenance);
	}
}

export function ensureWithstationPrizePresent(
	presentBox: UserPresentBoxState,
	master: ArchivePrizeMaster,
	provenance: EntityProvenance,
): void {
	const pendingPresent = findWithstationPrizePresent(
		presentBox,
		master.liveId,
		provenance.identityFingerprint,
	);
	if (pendingPresent === undefined) {
		addWithstationPrizePresent(presentBox, master, provenance);
	}
}

export function syncArchivePrizePresents(
	presentBox: UserPresentBoxState,
	master: ArchivePrizeMaster,
	requiredPendingStarCount: number,
	provenance: EntityProvenance,
): void {
	const currentPendingPresentCount = presentBox.presentList.filter(
		(present) =>
			isArchivePrizePresent(present) && present.live_id === master.liveId,
	).length;
	if (requiredPendingStarCount > 0) {
		if (currentPendingPresentCount === 0) {
			addArchivePrizePresent(presentBox, master, provenance);
			return;
		}
		if (currentPendingPresentCount > 1) {
			removePendingArchivePrizePresents(
				presentBox,
				master.liveId,
				currentPendingPresentCount - 1,
			);
		}
		return;
	}
	if (requiredPendingStarCount === 0 && currentPendingPresentCount > 0) {
		removePendingArchivePrizePresents(
			presentBox,
			master.liveId,
			currentPendingPresentCount,
		);
	}
}

function addArchivePrizePresent(
	presentBox: UserPresentBoxState,
	master: ArchivePrizeMaster,
	provenance: EntityProvenance,
): void {
	addPresentBoxItem(
		presentBox,
		{
			itemId: ARCHIVE_WITHLIVE_STAR_ITEM_ID,
			itemType: 1,
			name: `${formatArchivePrizeDate(master.liveStartTime)}With×MEETSアーカイブプライズ`,
		},
		1,
		`「${master.title}」のアーカイブで獲得したWith Starです。`,
		null,
		master.liveId,
		provenance,
	);
}

function addWithstationPrizePresent(
	presentBox: UserPresentBoxState,
	master: ArchivePrizeMaster,
	provenance: EntityProvenance,
): void {
	addPresentBoxItem(
		presentBox,
		{
			itemId: WITHSTATION_STAR_ITEM_ID,
			itemType: 1,
			name: `${formatArchivePrizeDate(master.liveStartTime)}With×STATIONプライズ`,
		},
		1,
		`「${master.title}」ご視聴ありがとうございました。`,
		null,
		master.liveId,
		provenance,
	);
}

function removePendingArchivePrizePresents(
	presentBox: UserPresentBoxState,
	liveId: string,
	presentCount: number,
): void {
	let remainingPresentCount = presentCount;
	presentBox.presentList = presentBox.presentList.flatMap((present) => {
		if (
			remainingPresentCount <= 0 ||
			!isArchivePrizePresent(present) ||
			present.live_id !== liveId
		) {
			return [present];
		}
		remainingPresentCount -= 1;
		return [];
	});
}

function formatArchivePrizeDate(liveStartTime: string): string {
	const date = new Date(liveStartTime);
	if (Number.isNaN(date.getTime())) {
		return '';
	}
	return `【${date.getUTCMonth() + 1}/${date.getUTCDate()}】`;
}
