import type {
	UserArchiveCollectionState,
	UserStickerState,
} from './archive-collection-definition.ts';
import type {
	EntityIdentityFingerprint,
	EntityProvenance,
} from './entity-provenance.ts';
import { findCompatibleMasterBoundProgress } from './master-bound-progress.ts';
import type { CollectionStickerInfo } from './sticker-definition.ts';

export function getOwnedStickerIds(
	collection: UserArchiveCollectionState,
	resolveFingerprint: (
		stickerId: number,
	) => EntityIdentityFingerprint | undefined,
): number[] {
	return [
		...new Set(
			collection.userStickerStates.map((sticker) => sticker.stickerId),
		),
	].filter((stickerId) => {
		const fingerprint = resolveFingerprint(stickerId);
		return (
			fingerprint !== undefined &&
			findUserStickerState(collection, stickerId, fingerprint)?.isOwned === true
		);
	});
}

export function createUserStickerInfoList(
	collection: UserArchiveCollectionState,
	stickerCatalog: readonly CollectionStickerInfo[],
	resolveFingerprint: (
		stickerId: number,
	) => EntityIdentityFingerprint | undefined,
): CollectionStickerInfo[] {
	return stickerCatalog.map((sticker) => {
		const fingerprint = resolveFingerprint(sticker.stickers_id);
		const state =
			fingerprint === undefined
				? undefined
				: findUserStickerState(collection, sticker.stickers_id, fingerprint);
		return state === undefined
			? { ...sticker }
			: applyUserStickerState(sticker, state);
	});
}

export function addUserSticker(
	collection: UserArchiveCollectionState,
	stickerCatalog: readonly CollectionStickerInfo[],
	stickerId: number,
	createTime: string,
	provenance: EntityProvenance,
): boolean {
	const catalogSticker = stickerCatalog.find(
		(sticker) => sticker.stickers_id === stickerId,
	);
	if (catalogSticker === undefined) return false;
	const ownedSticker = createOwnedUserStickerState(
		catalogSticker,
		createTime,
		provenance,
	);
	const exactIndex = collection.userStickerStates.findIndex(
		(sticker) =>
			sticker.stickerId === stickerId &&
			sticker.identityFingerprint?.domain ===
				provenance.identityFingerprint.domain &&
			sticker.identityFingerprint.value ===
				provenance.identityFingerprint.value,
	);
	collection.userStickerStates =
		exactIndex === -1
			? [...collection.userStickerStates, ownedSticker]
			: collection.userStickerStates.map((sticker, index) =>
					index === exactIndex ? ownedSticker : sticker,
				);
	return true;
}

export function addAllUserStickers(
	collection: UserArchiveCollectionState,
	stickerCatalog: readonly CollectionStickerInfo[],
	createTime: string,
	resolveProvenance: (stickerId: number) => EntityProvenance | undefined,
): number {
	let addedCount = 0;
	for (const sticker of stickerCatalog) {
		const provenance = resolveProvenance(sticker.stickers_id);
		if (provenance === undefined) continue;
		if (
			findUserStickerState(
				collection,
				sticker.stickers_id,
				provenance.identityFingerprint,
			)?.isOwned === true
		)
			continue;
		addUserSticker(
			collection,
			stickerCatalog,
			sticker.stickers_id,
			createTime,
			provenance,
		);
		addedCount += 1;
	}
	return addedCount;
}

export function removeUserSticker(
	collection: UserArchiveCollectionState,
	stickerCatalog: readonly CollectionStickerInfo[],
	stickerId: number,
	provenance: EntityProvenance,
): boolean {
	const catalogSticker = stickerCatalog.find(
		(sticker) => sticker.stickers_id === stickerId,
	);
	const current = findUserStickerState(
		collection,
		stickerId,
		provenance.identityFingerprint,
	);
	if (catalogSticker === undefined || current?.isOwned !== true) return false;
	collection.userStickerStates = [
		...collection.userStickerStates.filter(
			(sticker) =>
				sticker !== current || sticker.identityFingerprint === undefined,
		),
		createUnownedUserStickerState(catalogSticker, provenance),
	];
	return true;
}

function createOwnedUserStickerState(
	sticker: CollectionStickerInfo,
	createTime: string,
	provenance: EntityProvenance,
): UserStickerState {
	return {
		...provenance,
		stickerId: sticker.stickers_id,
		requirementProgress: sticker.requirement_num,
		variantRequirementProgress: sticker.variant_requirement_num,
		isOwned: true,
		isAvailableVariant: sticker.is_variant === 1,
		createTime,
	};
}

function createUnownedUserStickerState(
	sticker: CollectionStickerInfo,
	provenance: EntityProvenance,
): UserStickerState {
	return {
		...provenance,
		stickerId: sticker.stickers_id,
		requirementProgress: sticker.requirement_progress,
		variantRequirementProgress: sticker.variant_requirement_progress,
		isOwned: false,
		isAvailableVariant: false,
		createTime: null,
	};
}

function findUserStickerState(
	collection: UserArchiveCollectionState,
	stickerId: number,
	targetFingerprint: EntityIdentityFingerprint,
): UserStickerState | undefined {
	return findCompatibleMasterBoundProgress(
		collection.userStickerStates,
		(sticker) => sticker.stickerId === stickerId,
		targetFingerprint,
	);
}

function applyUserStickerState(
	sticker: CollectionStickerInfo,
	state: UserStickerState,
): CollectionStickerInfo {
	return {
		...sticker,
		requirement_progress: state.requirementProgress,
		variant_requirement_progress: state.variantRequirementProgress,
		is_owned: state.isOwned,
		is_available_variant: state.isAvailableVariant,
		create_time: state.createTime,
	};
}
