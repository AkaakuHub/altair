import type {
	EntityIdentityFingerprint,
	EntityProvenance,
} from './entity-provenance.ts';
import {
	isArrayOf,
	isJsonObject,
	type JsonObject,
} from './json-state-utils.ts';

export type WatchedArchiveMembership = EntityProvenance & {
	archiveId: string;
};

export type UserArchiveCollectionState = {
	playerId: string;
	archiveHome?: JsonObject;
	archiveList?: JsonObject[];
	currentWithliveArchiveId?: string;
	currentWithliveArchiveMasterReleaseId?: string;
	currentWithliveArchiveStartedAt?: string;
	currentWithliveArchiveStartSecond?: number;
	currentWithliveArchiveMainStartSecond?: number;
	currentWithliveArchiveCommentOffsetSecond?: number;
	currentWithstationArchiveId?: string;
	currentWithstationArchiveMasterReleaseId?: string;
	currentWithstationArchiveStartedAt?: string;
	currentWithstationArchiveStartMillisecond?: number;
	watchedWithliveArchiveIds: string[];
	watchedFesArchiveIds: string[];
	watchedWithliveArchiveMemberships?: WatchedArchiveMembership[];
	watchedFesArchiveMemberships?: WatchedArchiveMembership[];
	filterableCharacters?: JsonObject[];
	sortableFields?: JsonObject[];
	userStickerStates: UserStickerState[];
};

export type UserStickerState = {
	sourceMasterReleaseId?: string;
	identityFingerprint?: EntityIdentityFingerprint;
	stickerId: number;
	requirementProgress: number;
	variantRequirementProgress: number;
	isOwned: boolean;
	isAvailableVariant: boolean;
	createTime: string | null;
};

export function isUserArchiveCollectionState(
	value: unknown,
): value is UserArchiveCollectionState {
	if (!isJsonObject(value)) return false;
	return (
		typeof value.playerId === 'string' &&
		(value.archiveHome === undefined || isJsonObject(value.archiveHome)) &&
		(value.archiveList === undefined ||
			isArrayOf(value.archiveList, isJsonObject)) &&
		(value.currentWithliveArchiveId === undefined ||
			typeof value.currentWithliveArchiveId === 'string') &&
		(value.currentWithliveArchiveMasterReleaseId === undefined ||
			typeof value.currentWithliveArchiveMasterReleaseId === 'string') &&
		(value.currentWithliveArchiveStartedAt === undefined ||
			typeof value.currentWithliveArchiveStartedAt === 'string') &&
		(value.currentWithliveArchiveStartSecond === undefined ||
			typeof value.currentWithliveArchiveStartSecond === 'number') &&
		(value.currentWithliveArchiveMainStartSecond === undefined ||
			typeof value.currentWithliveArchiveMainStartSecond === 'number') &&
		(value.currentWithliveArchiveCommentOffsetSecond === undefined ||
			typeof value.currentWithliveArchiveCommentOffsetSecond === 'number') &&
		(value.currentWithstationArchiveId === undefined ||
			typeof value.currentWithstationArchiveId === 'string') &&
		(value.currentWithstationArchiveMasterReleaseId === undefined ||
			typeof value.currentWithstationArchiveMasterReleaseId === 'string') &&
		(value.currentWithstationArchiveStartedAt === undefined ||
			typeof value.currentWithstationArchiveStartedAt === 'string') &&
		(value.currentWithstationArchiveStartMillisecond === undefined ||
			typeof value.currentWithstationArchiveStartMillisecond === 'number') &&
		isArrayOf(value.watchedWithliveArchiveIds, isString) &&
		isArrayOf(value.watchedFesArchiveIds, isString) &&
		(value.watchedWithliveArchiveMemberships === undefined ||
			isArrayOf(
				value.watchedWithliveArchiveMemberships,
				isWatchedArchiveMembership,
			)) &&
		(value.watchedFesArchiveMemberships === undefined ||
			isArrayOf(
				value.watchedFesArchiveMemberships,
				isWatchedArchiveMembership,
			)) &&
		(value.filterableCharacters === undefined ||
			isArrayOf(value.filterableCharacters, isJsonObject)) &&
		(value.sortableFields === undefined ||
			isArrayOf(value.sortableFields, isJsonObject)) &&
		isArrayOf(value.userStickerStates, isUserStickerState)
	);
}

function isWatchedArchiveMembership(
	value: unknown,
): value is WatchedArchiveMembership {
	return (
		isJsonObject(value) &&
		typeof value.archiveId === 'string' &&
		typeof value.sourceMasterReleaseId === 'string' &&
		isJsonObject(value.identityFingerprint) &&
		typeof value.identityFingerprint.domain === 'string' &&
		typeof value.identityFingerprint.value === 'string'
	);
}

function isString(value: unknown): value is string {
	return typeof value === 'string';
}

function isUserStickerState(value: unknown): value is UserStickerState {
	if (!isJsonObject(value)) return false;
	return (
		(value.sourceMasterReleaseId === undefined ||
			typeof value.sourceMasterReleaseId === 'string') &&
		(value.identityFingerprint === undefined ||
			(isJsonObject(value.identityFingerprint) &&
				typeof value.identityFingerprint.domain === 'string' &&
				typeof value.identityFingerprint.value === 'string')) &&
		typeof value.stickerId === 'number' &&
		typeof value.requirementProgress === 'number' &&
		typeof value.variantRequirementProgress === 'number' &&
		typeof value.isOwned === 'boolean' &&
		typeof value.isAvailableVariant === 'boolean' &&
		(value.createTime === null || typeof value.createTime === 'string')
	);
}
