import type { UserStatusController } from '../application/user-status-controller.ts';
import type { ServerRuntimeDefaults } from '../server-runtime-defaults.ts';
import type { ServerState } from '../server-state-schema.ts';
import type { UserArchiveCollectionState } from '../state/archive-collection-definition.ts';
import { syncGrandPrixRankingFromRuntime } from '../state/grand-prix-ranking-runtime-sync.ts';
import { ensureUserHeaderStates } from '../state/user-header-state.ts';
import type { UserLiveState } from '../state/user-live-state.ts';
import { migrateUserGachaState } from './user-gacha-state-migration.ts';
import { migrateUserInventoryState } from './user-inventory-state-migration.ts';
import { migrateUserRhythmMusicScores } from './user-rhythm-game-state-migration.ts';
import { migrateUserShopExchangeState } from './user-shop-exchange-state-migration.ts';

export function applyServerStateMigrations(
	state: ServerState,
	resolveUserStatus: (playerId: string) => UserStatusController,
	runtimeDefaults: ServerRuntimeDefaults,
): void {
	addGradeChallengeRuntimeState(state, runtimeDefaults);
	addGradeLiveRuntimeState(state, runtimeDefaults);
	addUserGradeChallengeProgressState(state);
	addUserRhythmGameGrandPrixState(state);
	addUserRhythmMusicScoreExperience(state);
	removeArchiveCatalogCopies(state);
	addSeasonFanLevelBuckets(state, resolveUserStatus);
	addPetalExchangePurchaseState(state);
	addMissingUserItemPickupTimes(state);
	addUserCircleNotificationState(state);
	addGrandPrixRankingState(state);
	addUserHeaderState(state);
	addGachaPaidOnlyPurchaseState(state);
	removeGachaPurchasePlansWithEmptyBonusRows(state);
}

function addUserRhythmMusicScoreExperience(state: ServerState): void {
	for (const userLive of state.userLives)
		migrateUserRhythmMusicScores(userLive);
}

function addGradeChallengeRuntimeState(
	state: ServerState,
	runtimeDefaults: ServerRuntimeDefaults,
): void {
	state.gradeChallenge ??= structuredClone(runtimeDefaults.gradeChallenge);
}

function addGradeLiveRuntimeState(
	state: ServerState,
	runtimeDefaults: ServerRuntimeDefaults,
): void {
	state.gradeLive ??= structuredClone(runtimeDefaults.gradeLive);
}

function addUserGradeChallengeProgressState(state: ServerState): void {
	for (const userLive of state.userLives) {
		userLive.gradeChallengeProgressList ??= [];
		userLive.gradeChallengeSeasonProgressList ??= [];
		backfillUserGradeChallengeSeasonProgress(userLive);
	}
}

function addUserRhythmGameGrandPrixState(state: ServerState): void {
	for (const userLive of state.userLives) {
		userLive.currentRhythmGameGrandPrix ??= null;
		userLive.rhythmGameGrandPrixes ??= [];
	}
}

function backfillUserGradeChallengeSeasonProgress(
	userLive: UserLiveState,
): void {
	const seasonGradePointById = new Map<number, number>();
	for (const progress of userLive.gradeChallengeProgressList) {
		const point = seasonGradePointById.get(progress.gradeChalSeasonId) ?? 0;
		seasonGradePointById.set(
			progress.gradeChalSeasonId,
			point + Math.floor(progress.highScore / 1_000_000_000),
		);
	}
	for (const [gradeChalSeasonId, seasonGradePoint] of seasonGradePointById) {
		const existing = userLive.gradeChallengeSeasonProgressList.find(
			(progress) => progress.gradeChalSeasonId === gradeChalSeasonId,
		);
		if (existing === undefined) {
			userLive.gradeChallengeSeasonProgressList.push({
				gradeChalSeasonId,
				seasonGradePoint,
			});
		} else if (existing.seasonGradePoint < seasonGradePoint) {
			existing.seasonGradePoint = seasonGradePoint;
		}
	}
	userLive.gradeChallengeSeasonProgressList.sort(
		(left, right) => left.gradeChalSeasonId - right.gradeChalSeasonId,
	);
}

function removeArchiveCatalogCopies(state: ServerState): void {
	state.userArchiveCollections = state.userArchiveCollections.map(
		removeArchiveCatalogCopy,
	);
}

function addSeasonFanLevelBuckets(
	state: ServerState,
	resolveUserStatus: (playerId: string) => UserStatusController,
): void {
	for (const userStatus of state.userStatuses)
		resolveUserStatus(userStatus.playerId).migrateSeasonFanLevels(userStatus);
}

function addPetalExchangePurchaseState(state: ServerState): void {
	for (const exchange of state.userShopExchanges)
		migrateUserShopExchangeState(exchange);
}

function addMissingUserItemPickupTimes(state: ServerState): void {
	for (const inventory of state.userInventories) {
		migrateUserInventoryState(inventory);
	}
}

function addUserCircleNotificationState(state: ServerState): void {
	state.userCircleNotifications ??= [];
}

function addGrandPrixRankingState(state: ServerState): void {
	state.grandPrixRankings ??= [];
	if (state.grandPrix.guildRanking > 0 || state.grandPrix.guildTotalPoint > 0)
		syncGrandPrixRankingFromRuntime(state, {
			syncCircle: true,
			syncPersonal: true,
		});
}

function addUserHeaderState(state: ServerState): void {
	ensureUserHeaderStates(state);
}

function addGachaPaidOnlyPurchaseState(state: ServerState): void {
	for (const userGacha of state.userGachas) migrateUserGachaState(userGacha);
}

function removeGachaPurchasePlansWithEmptyBonusRows(state: ServerState): void {
	for (const userGacha of state.userGachas) {
		userGacha.purchasePlans = userGacha.purchasePlans.filter(
			(plan) =>
				!plan.bonusResults.some((bonus) => {
					const items = bonus.gacha_bonus_item_result_list;
					return Array.isArray(items) && items.length === 0;
				}),
		);
	}
}

function removeArchiveCatalogCopy(
	collection: UserArchiveCollectionState,
): UserArchiveCollectionState {
	const result: UserArchiveCollectionState = {
		playerId: collection.playerId,
		watchedWithliveArchiveIds: collection.watchedWithliveArchiveIds,
		watchedFesArchiveIds: collection.watchedFesArchiveIds,
		...(collection.watchedWithliveArchiveMemberships === undefined
			? {}
			: {
					watchedWithliveArchiveMemberships:
						collection.watchedWithliveArchiveMemberships,
				}),
		...(collection.watchedFesArchiveMemberships === undefined
			? {}
			: {
					watchedFesArchiveMemberships: collection.watchedFesArchiveMemberships,
				}),
		userStickerStates: collection.userStickerStates,
	};
	if (collection.currentWithliveArchiveId !== undefined)
		result.currentWithliveArchiveId = collection.currentWithliveArchiveId;
	if (collection.currentWithliveArchiveMasterReleaseId !== undefined)
		result.currentWithliveArchiveMasterReleaseId =
			collection.currentWithliveArchiveMasterReleaseId;
	if (collection.currentWithliveArchiveStartedAt !== undefined)
		result.currentWithliveArchiveStartedAt =
			collection.currentWithliveArchiveStartedAt;
	if (collection.currentWithliveArchiveStartSecond !== undefined)
		result.currentWithliveArchiveStartSecond =
			collection.currentWithliveArchiveStartSecond;
	if (collection.currentWithliveArchiveMainStartSecond !== undefined)
		result.currentWithliveArchiveMainStartSecond =
			collection.currentWithliveArchiveMainStartSecond;
	if (collection.currentWithliveArchiveCommentOffsetSecond !== undefined)
		result.currentWithliveArchiveCommentOffsetSecond =
			collection.currentWithliveArchiveCommentOffsetSecond;
	if (collection.currentWithstationArchiveId !== undefined)
		result.currentWithstationArchiveId = collection.currentWithstationArchiveId;
	if (collection.currentWithstationArchiveMasterReleaseId !== undefined)
		result.currentWithstationArchiveMasterReleaseId =
			collection.currentWithstationArchiveMasterReleaseId;
	if (collection.currentWithstationArchiveStartedAt !== undefined)
		result.currentWithstationArchiveStartedAt =
			collection.currentWithstationArchiveStartedAt;
	if (collection.currentWithstationArchiveStartMillisecond !== undefined)
		result.currentWithstationArchiveStartMillisecond =
			collection.currentWithstationArchiveStartMillisecond;
	return result;
}
