import { Hono } from 'hono';
import { projectOwnedStickerIds } from '../../application/archive-sticker-projection.ts';
import {
	projectUserCards,
	projectUserInventory,
} from '../../application/user-owned-master-projection.ts';
import { getHomeCustomCandidateCardDatasIdsFromDatabase } from '../../master-data/card-catalog.ts';
import { getCollectionStickerInfoListFromDatabase } from '../../master-data/collection-sticker-info.ts';
import { getStickerIdentityFingerprint } from '../../master-data/sticker-identity.ts';
import { createUserOwnedMasterSupport } from '../../master-data/user-owned-master-support.ts';
import { calculateFanLevel } from '../../state/fan-level-calculation.ts';
import { createFriendCardInfo } from '../../state/friend-card-profile-projection.ts';
import {
	createProfileCircleInfo,
	ensureUserProfileDesign,
} from '../../state/profile-design-state.ts';
import {
	ensureUserProfileSettings,
	setCurrentHomeWallpaperSetting,
	setSavedHomeWallpaperSetting,
} from '../../state/profile-settings-state.ts';
import { ensureUserCards } from '../../state/user-card-aggregate-state.ts';
import { ensureUserInventory } from '../../state/user-inventory-aggregate.ts';
import { getOwnedStickerIds } from '../../state/user-sticker-ownership.ts';
import {
	getProfileStatsFromDatabase,
	getProfileUserProgressStatsFromDatabase,
} from '../active-master-database/profile-stats.ts';
import { readJson } from '../http/read-json.ts';
import type { EmptyRequest } from '../response-types/empty-request.ts';
import { createHomeGetWallpaperSettingResponse } from '../responses/home-wallpaper-response.ts';
import type { HomeCustomSettingResponse } from '../responses/profile-response.ts';
import { createHomeCustomSettingResponse } from '../responses/profile-response.ts';
import { createUserIconFrameList } from '../responses/user-items-response.ts';
import {
	apkDumpTypedEndpoint,
	typedEndpoint,
} from '../route-support/endpoint-source.ts';
import { createFanLevelList } from '../route-support/fan-level-response-mapper.ts';
import { getStringField } from '../route-support/request-fields.ts';
import {
	ensureRouteUserArchiveCollectionState,
	ensureRouteUserLiveState,
} from '../route-support/request-user-state.ts';
import {
	getRequestUser,
	persistRouteState,
	persistRouteStateIfChanged,
} from '../route-support/route-state.ts';
import type { StateRouteContext } from '../route-support/state-route-context.ts';

export type HomeGetWallpaperSettingRequest = Record<string, never>;
export type HomeGetWallpaperSettingResponse = ReturnType<
	typeof createHomeGetWallpaperSettingResponse
>;
export type HomeSetCurrentWallpaperSettingRequest = {
	d_home_wall_paper_settings_id: string;
};
export type HomeSetWallpaperSettingRequest = {
	d_home_wall_paper_settings_id: string;
	wallpaper_setting_info: string;
};
export type HomeWallpaperSettingResultResponse = {
	result: boolean;
};

export function createProfileHomeRoutes(routeContext: StateRouteContext): Hono {
	const app = new Hono();
	const { defaultHeaders, state, userCardGetList } = routeContext;

	apkDumpTypedEndpoint<
		HomeGetWallpaperSettingRequest,
		HomeGetWallpaperSettingResponse
	>();
	app.post('/v1/home/get_wallpaper_setting', (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) {
			return user;
		}
		const settings = ensureUserProfileSettings(state, user.playerId).value;
		routeContext.applyResponseHeaders(c, defaultHeaders, { user });
		return c.json(createHomeGetWallpaperSettingResponse(settings));
	});

	apkDumpTypedEndpoint<
		HomeSetCurrentWallpaperSettingRequest,
		HomeWallpaperSettingResultResponse
	>();
	app.post('/v1/home/set_current_wallpaper_setting', async (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) {
			return user;
		}
		const body = await readJson(c.req.raw);
		const updated = setCurrentHomeWallpaperSetting(
			ensureUserProfileSettings(state, user.playerId).value,
			getStringField(body, 'd_home_wall_paper_settings_id'),
		);
		if (updated) {
			persistRouteState(routeContext);
		}
		routeContext.applyResponseHeaders(c, defaultHeaders, { user });
		return c.json({ result: updated });
	});

	apkDumpTypedEndpoint<
		HomeSetWallpaperSettingRequest,
		HomeWallpaperSettingResultResponse
	>();
	app.post('/v1/home/set_wallpaper_setting', async (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) {
			return user;
		}
		const updated = setSavedHomeWallpaperSetting(
			ensureUserProfileSettings(state, user.playerId).value,
			await readJson(c.req.raw),
		);
		if (updated) {
			persistRouteState(routeContext);
		}
		routeContext.applyResponseHeaders(c, defaultHeaders, { user });
		return c.json({ result: updated });
	});

	typedEndpoint<EmptyRequest, HomeCustomSettingResponse>();
	app.post('/v1/home/get_custom_setting', (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) {
			return user;
		}
		const designResult = ensureUserProfileDesign(state, user.playerId);
		const design = designResult.value;
		const cardsResult = ensureUserCards(state, user.playerId, userCardGetList);
		const canonicalCards = cardsResult.value;
		const liveResult = ensureRouteUserLiveState(routeContext, user.playerId);
		const live = liveResult.value;
		const userStatus = routeContext.resolveUserStatus(c, user);
		const statusResult = userStatus.ensure(state, user.playerId);
		const status = statusResult.value;
		const settingsResult = ensureUserProfileSettings(state, user.playerId);
		const settings = settingsResult.value;
		const inventoryResult = ensureUserInventory(
			state,
			user.playerId,
			routeContext.userItemsGetList,
		);
		const collectionResult = ensureRouteUserArchiveCollectionState(
			routeContext,
			user.playerId,
		);
		const collection = collectionResult.value;
		const database = routeContext.resolveMasterDatabase(c, user);
		const masterSupport = createUserOwnedMasterSupport(database);
		const inventory = projectUserInventory(
			inventoryResult.value,
			masterSupport,
		);
		const cards = projectUserCards(canonicalCards, masterSupport);
		const supportedStickerIds = new Set(
			getCollectionStickerInfoListFromDatabase(database).map(
				(sticker) => sticker.stickers_id,
			),
		);
		const ownedStickerIds = projectOwnedStickerIds(
			getOwnedStickerIds(collection, (stickerId) =>
				getStickerIdentityFingerprint(database, stickerId),
			),
			supportedStickerIds,
		);
		persistRouteStateIfChanged(
			routeContext,
			designResult.created ||
				cardsResult.created ||
				liveResult.created ||
				statusResult.created ||
				settingsResult.created ||
				collectionResult.created ||
				inventoryResult.created,
		);
		routeContext.applyResponseHeaders(c, defaultHeaders, { user });
		return c.json(
			createHomeCustomSettingResponse(
				design,
				user,
				cards,
				getProfileStatsFromDatabase(database),
				getProfileUserProgressStatsFromDatabase(database, live),
				calculateFanLevel(userStatus.getMemberFanLevels(status)),
				createFanLevelList(userStatus.getCurrentSeasonMemberFanLevels(status)),
				settings,
				createProfileCircleInfo(state.circle, user.playerId),
				ownedStickerIds,
				createUserIconFrameList(inventory),
				createFriendCardInfo(state, cards, user.playerId),
				getHomeCustomCandidateCardDatasIdsFromDatabase(
					database,
					cards.userCardDataList
						.map((card) => card.card_datas_id)
						.filter((cardDatasId) => typeof cardDatasId === 'number'),
				),
			),
		);
	});

	return app;
}
