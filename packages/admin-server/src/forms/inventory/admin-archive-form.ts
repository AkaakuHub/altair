import { setArchiveGiftPointAndPrizePresents } from '../../../../../src/application/archive-prize-gift-points.ts';
import { allocateArchivePrizeStars } from '../../../../../src/application/archive-prize-star-allocation.ts';
import { readPrizeStarAllocations } from '../../../../../src/application/prize-star-allocations.ts';
import type { UserStatusController } from '../../../../../src/application/user-status-controller.ts';
import type { ActiveMasterRouteSelection as MasterDatabaseSelection } from '../../../../../src/master-data/active-master-repository.ts';
import {
	getGiftLiveIdentityFingerprint,
	getGiftLiveProvenance,
} from '../../../../../src/master-data/archive-identity.ts';
import { getArchivePrizeMasterFromDatabase } from '../../../../../src/master-data/archive-master-data.ts';
import { getCollectionStickerInfoListFromDatabase } from '../../../../../src/master-data/collection-sticker-info.ts';
import { getStickerProvenance } from '../../../../../src/master-data/sticker-identity.ts';
import type { ServerState } from '../../../../../src/server-state-schema.ts';
import { ensureUserArchiveCollectionState } from '../../../../../src/state/archive-collection-aggregate.ts';
import type { MemberFanLevelBoundary } from '../../../../../src/state/member-fan-level-definition.ts';
import { createUtcTimestamp } from '../../../../../src/state/registered-user-state.ts';
import { ensureUserPresentBox } from '../../../../../src/state/user-presents-state.ts';
import {
	addAllUserStickers,
	addUserSticker,
	removeUserSticker,
} from '../../../../../src/state/user-sticker-ownership.ts';
import { findAdminEntryByKey } from '../../state/domain/admin-state-writer.ts';
import {
	type AdminForm,
	getAdminBoundedInteger,
	getAdminPositiveId,
	getFormString,
} from '../shared/admin-form-values.ts';

export function addUserStickerFromForm(
	form: AdminForm,
	state: ServerState,
	selection: MasterDatabaseSelection,
): boolean {
	const stickerCatalog = getCollectionStickerInfoListFromDatabase(
		selection.database,
	);
	const playerId = getFormString(form, 'playerId');
	const stickerId = getAdminPositiveId(form, 'stickerId');
	if (
		playerId.length === 0 ||
		stickerId === undefined ||
		!stickerCatalog.some((sticker) => sticker.stickers_id === stickerId)
	) {
		return false;
	}
	const provenance = getStickerProvenance(
		selection.database,
		selection.masterReleaseId,
		stickerId,
	);
	if (provenance === undefined) return false;
	return addUserSticker(
		ensureUserArchiveCollectionState(state, playerId).value,
		stickerCatalog,
		stickerId,
		createUtcTimestamp(),
		provenance,
	);
}

export function addAllUserStickersFromForm(
	form: AdminForm,
	state: ServerState,
	selection: MasterDatabaseSelection,
): boolean {
	const stickerCatalog = getCollectionStickerInfoListFromDatabase(
		selection.database,
	);
	const playerId = getFormString(form, 'playerId');
	if (playerId.length === 0 || stickerCatalog.length === 0) {
		return false;
	}
	addAllUserStickers(
		ensureUserArchiveCollectionState(state, playerId).value,
		stickerCatalog,
		createUtcTimestamp(),
		(stickerId) =>
			getStickerProvenance(
				selection.database,
				selection.masterReleaseId,
				stickerId,
			),
	);
	return true;
}

export function removeUserStickerFromForm(
	form: AdminForm,
	state: ServerState,
	selection: MasterDatabaseSelection,
): boolean {
	const stickerCatalog = getCollectionStickerInfoListFromDatabase(
		selection.database,
	);
	const playerId = getFormString(form, 'playerId');
	const stickerId = getAdminPositiveId(form, 'stickerId');
	if (playerId.length === 0 || stickerId === undefined) {
		return false;
	}
	const provenance = getStickerProvenance(
		selection.database,
		selection.masterReleaseId,
		stickerId,
	);
	if (provenance === undefined) return false;
	return removeUserSticker(
		ensureUserArchiveCollectionState(state, playerId).value,
		stickerCatalog,
		stickerId,
		provenance,
	);
}

export function updateArchiveGiftPointFromForm(
	form: AdminForm,
	state: ServerState,
	selection: MasterDatabaseSelection,
): boolean {
	const { database } = selection;
	const playerId = getFormString(form, 'playerId');
	const liveId = getFormString(form, 'liveId');
	const totalUserGiftPoint = getAdminBoundedInteger(
		form,
		'totalUserGiftPoint',
		0,
		999_999_999,
	);
	const totalUserGiftPointWithoutArchive = getAdminBoundedInteger(
		form,
		'totalUserGiftPointWithoutArchive',
		0,
		999_999_999,
	);
	if (
		playerId.length === 0 ||
		liveId.length === 0 ||
		totalUserGiftPoint === undefined ||
		totalUserGiftPointWithoutArchive === undefined ||
		!state.registeredUsers.some((user) => user.playerId === playerId)
	) {
		return false;
	}
	const archivePrizeMaster = getArchivePrizeMasterFromDatabase(
		database,
		liveId,
	);
	if (archivePrizeMaster === undefined) {
		return false;
	}
	const liveProvenance = getGiftLiveProvenance(
		database,
		selection.masterReleaseId,
		'withlive',
		liveId,
	);
	if (liveProvenance === undefined) return false;
	const presentBox = ensureUserPresentBox(state, playerId).value;
	setArchiveGiftPointAndPrizePresents(
		state,
		presentBox,
		playerId,
		liveId,
		totalUserGiftPoint,
		totalUserGiftPointWithoutArchive,
		archivePrizeMaster,
		liveProvenance,
		liveProvenance,
	);
	return true;
}

export function allocateArchivePrizeStarsFromForm(
	form: AdminForm,
	state: ServerState,
	userStatus: UserStatusController,
	memberFanLevelTable: readonly MemberFanLevelBoundary[],
	database: MasterDatabaseSelection['database'],
): boolean {
	const playerId = getFormString(form, 'playerId');
	const presentBoxId = getFormString(form, 'presentBoxId');
	const setStarJson = getFormString(form, 'setStarJson');
	if (playerId.length === 0 || presentBoxId.length === 0) {
		return false;
	}
	const allocations = readPrizeStarAllocations(setStarJson);
	if (allocations === undefined) return false;
	const presentBox = findAdminEntryByKey(
		state.userPresentBoxes,
		playerId,
		(userPresentBox) => userPresentBox.playerId,
	);
	if (!presentBox) {
		return false;
	}
	return allocateArchivePrizeStars(
		state,
		playerId,
		presentBox,
		presentBoxId,
		allocations,
		userStatus,
		memberFanLevelTable,
		getGiftLiveIdentityFingerprint(
			database,
			'withlive',
			presentBox.presentList.find(
				(present) => present.d_present_boxes_id === presentBoxId,
			)?.live_id ?? '',
		),
	);
}
