import type { Database } from 'bun:sqlite';
import { getAdminCardCatalog } from '@altair/admin-server/catalog/application/admin-catalog.ts';
import { MasterDataAdminCardCatalogReader } from '@altair/admin-server/catalog/infrastructure/master-data-admin-card-catalog-reader.ts';
import {
	createAdminCardCatalogView,
	createAdminCardCollectionView,
} from '@altair/admin-server/presentation/page/admin-card-view.ts';
import { readSeedSummaryForAdminPage } from '@altair/admin-server/presentation/page/admin-page.ts';
import {
	createAdminStickerCatalogView,
	createAdminStickerCollectionView,
} from '@altair/admin-server/presentation/page/admin-sticker-view.ts';
import { redirectAdmin } from '@altair/admin-server/route-support/admin-route-helpers.ts';
import { ensureAdminVisibleUserMissionState } from '@altair/admin-server/route-support/admin-visible-user-mission-state.ts';
import { createAdminVisibleServerState } from '@altair/admin-server/state/application/admin-state-view.ts';
import { parseAdminStatePage } from '@altair/admin-server/state/domain/admin-state-page.ts';
import { MasterDataAdminArchiveActivityReader } from '@altair/admin-server/state/infrastructure/master-data-admin-archive-activity-reader.ts';
import type { AdminStateResponse } from '@altair/runtime/admin/dto/admin-state-response-schema.ts';
import type { RuntimeReleaseOption } from '@altair/runtime/admin/dto/runtime-resource-version-schema.ts';
import type { Hono } from 'hono';
import type { AdminRuntimeConfig } from '../../../../src/admin/configuration/runtimeConfig.ts';
import type { UserStatusControllerProvider } from '../../../../src/application/user-status-controller.ts';
import { getChapterAdminSummaryFromDatabase } from '../../../../src/master-data/chapter-admin-master-data.ts';
import { getCollectionStickerInfoListFromDatabase } from '../../../../src/master-data/collection-sticker-info.ts';
import { getGachaSeriesAdminSummaryFromDatabase } from '../../../../src/master-data/gacha-series-master.ts';
import { getGradeChallengeAdminSummaryFromDatabase } from '../../../../src/master-data/grade-challenge-admin-master-data.ts';
import { getGradeLiveAdminSummaryFromDatabase } from '../../../../src/master-data/grade-live-admin-master-data.ts';
import {
	getGrandPrixAdminDetailFromDatabase,
	getGrandPrixAdminSummaryFromDatabase,
} from '../../../../src/master-data/grand-prix-admin-master-data.ts';
import { getItemCatalogFromDatabase } from '../../../../src/master-data/item-master.ts';
import {
	getMemberFanLevelTableFromDatabase,
	getSeasonFanLevelTableFromDatabase,
} from '../../../../src/master-data/member-fan-level-master.ts';
import { getMusicLevelTableFromDatabase } from '../../../../src/master-data/music-levels.ts';
import { getSeasonMasterEntriesFromDatabase } from '../../../../src/master-data/season-master-data.ts';
import { getStandardQuestAdminAreasFromDatabase } from '../../../../src/master-data/standard-quest-admin-master-data.ts';
import { getServerRuntimeDefaultsFromDatabase } from '../../../../src/server-runtime-defaults.ts';
import {
	ensureGrandPrixRuntimeState,
	resetServerState,
} from '../../../../src/server-state.ts';
import type { ServerState } from '../../../../src/server-state-schema.ts';
import { supportedTutorialIds } from '../../../../src/state/user-tutorial-state.ts';
import type { AdminStateResponseProjector } from '../composition/admin-route-options.ts';

export function registerAdminPageRoutes(
	app: Hono,
	config: AdminRuntimeConfig,
	state: ServerState,
	resolveCurrentMasterDatabase: () => Database,
	resolveSelectedAdminUserMasterDatabase: () => Database,
	resolveAdminUserMasterSelection: (
		playerId: string,
	) => Readonly<{ masterReleaseId: string; database: Database }>,
	resolveUserStatus: UserStatusControllerProvider,
	listReleaseOptions: () => RuntimeReleaseOption[],
	projectStateResponse?: AdminStateResponseProjector,
	additionalStatePages: readonly string[] = [],
): void {
	app.get('/state.json', (c) => {
		const requestedPage = c.req.query('page');
		const page =
			requestedPage !== undefined &&
			additionalStatePages.includes(requestedPage)
				? 'extension'
				: parseAdminStatePage(requestedPage);
		const database = isServerWideAdminPage(page)
			? resolveCurrentMasterDatabase()
			: resolveSelectedAdminUserMasterDatabase();
		const selectedPlayerId = state.selectedAdminPlayerId;
		if (selectedPlayerId !== null && selectedPlayerId.length > 0) {
			const selection = resolveAdminUserMasterSelection(selectedPlayerId);
			ensureAdminVisibleUserMissionState(
				state,
				selection.database,
				selection.masterReleaseId,
			);
		}
		const fullCardCatalog =
			page === 'all' || page === 'cards' || page === 'gacha'
				? getAdminCardCatalog(new MasterDataAdminCardCatalogReader(database))
				: [];
		const cardCatalog = createAdminCardCatalogView(fullCardCatalog);
		const stickerCatalog =
			page === 'all' || page === 'stickers'
				? getCollectionStickerInfoListFromDatabase(database)
				: [];
		const response: AdminStateResponse = {
			state: createAdminVisibleServerState(
				state,
				page,
				new MasterDataAdminArchiveActivityReader(database),
				supportedTutorialIds,
			),
			userStatus: resolveUserStatus().getView(
				state,
				state.registeredUsers.find(
					(user) => user.playerId === state.selectedAdminPlayerId,
				),
			),
			seed: readSeedSummaryForAdminPage(page, database),
			itemCatalog:
				page === 'all' || page === 'items' || page === 'present-box'
					? getItemCatalogFromDatabase(database)
					: [],
			cardCatalog,
			cardCollection:
				page === 'all' || page === 'cards'
					? createAdminCardCollectionView(state, cardCatalog)
					: null,
			stickerCatalog:
				page === 'all' || page === 'stickers'
					? createAdminStickerCatalogView(stickerCatalog)
					: [],
			stickerCollection:
				page === 'all' || page === 'stickers'
					? createAdminStickerCollectionView(state, stickerCatalog, database)
					: null,
			memberFanLevelTable:
				page === 'all' || page === 'user-status'
					? getMemberFanLevelTableFromDatabase(database)
					: [],
			seasonFanLevelTable:
				page === 'all' || page === 'user-status'
					? getSeasonFanLevelTableFromDatabase(database)
					: [],
			seasonList:
				page === 'all' || page === 'user-status'
					? getSeasonMasterEntriesFromDatabase(database)
					: [],
			musicLevelTable:
				page === 'all' || page === 'quest'
					? getMusicLevelTableFromDatabase(database)
					: [],
			standardQuestAreas:
				page === 'all' || page === 'quest'
					? getStandardQuestAdminAreasFromDatabase(database)
					: [],
			chapterList:
				page === 'all' || page === 'overview'
					? getChapterAdminSummaryFromDatabase(database)
					: [],
			grandPrixList:
				page === 'all' || page === 'grand-prix'
					? getGrandPrixAdminSummaryFromDatabase(database)
					: [],
			grandPrixDetail:
				page === 'all' || page === 'grand-prix'
					? getGrandPrixAdminDetailFromDatabase(
							database,
							ensureGrandPrixRuntimeState(state),
						)
					: { series: [], rhythmGameSeries: [], rewards: [] },
			gradeLiveList:
				page === 'all' || page === 'grade-live'
					? getGradeLiveAdminSummaryFromDatabase(database)
					: [],
			gradeChallengeList:
				page === 'all' || page === 'grade-live'
					? getGradeChallengeAdminSummaryFromDatabase(database)
					: [],
			runtimeReleaseOptions:
				page === 'all' || page === 'overview' ? listReleaseOptions() : [],
		};
		return c.json(
			projectStateResponse === undefined
				? response
				: projectStateResponse(response, requestedPage ?? page),
		);
	});

	app.post('/reset', (c) => {
		const database = resolveCurrentMasterDatabase();
		resetServerState(
			state,
			config.stateStore,
			config.activeLoginBonusIds,
			getGachaSeriesAdminSummaryFromDatabase(database)
				.filter((series) => series.isCurrentlyOpen)
				.map((series) => series.gachaSeriesId),
			getServerRuntimeDefaultsFromDatabase(database),
		);
		return redirectAdmin(c);
	});
}

function isServerWideAdminPage(
	page: ReturnType<typeof parseAdminStatePage> | 'extension',
): boolean {
	return (
		page === 'all' ||
		page === 'overview' ||
		page === 'grand-prix' ||
		page === 'grade-live' ||
		page === 'gacha-server' ||
		page === 'extension' ||
		page === 'login-bonus-server'
	);
}
