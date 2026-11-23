import { Hono } from 'hono';
import {
	projectUserCards,
	projectUserInventory,
} from '../../application/user-owned-master-projection.ts';
import { createUserOwnedMasterSupport } from '../../master-data/user-owned-master-support.ts';
import {
	ensureGradeChallengeRuntimeState,
	ensureGradeLiveRuntimeState,
	ensureGrandPrixRuntimeState,
} from '../../server-state.ts';
import { ensureUserCards } from '../../state/user-card-aggregate-state.ts';
import { ensureUserInventory } from '../../state/user-inventory-aggregate.ts';
import { applyDreamLiveMemberSelect } from '../active-master-database/dream-live-responses.ts';
import { createQuestTopResponse } from '../active-master-database/quest-top-response-service.ts';
import { applyStandardAreaLocks } from '../active-master-database/standard-quest-responses.ts';
import type {
	ActivityRecordAdvRequest,
	ActivityRecordPlayAdvDataResponse,
	ActivityRecordSetWatchableStatusResponse,
	ActivityRecordTopResponse,
	OutQuestLiveDailyStageSelectResponse,
	StepUpBeginnerMissionListResponse,
	WebviewThemeListResponse,
} from '../response-types/app-content-response-types.ts';
import type {
	GiftShopListResponse,
	QuestTopWithMembersResponse,
	WithliveGiftShopListRequest,
	WithstationGiftShopListRequest,
} from '../response-types/content-top-response-types.ts';
import type { EmptyRequest } from '../response-types/empty-request.ts';
import {
	createOutQuestLiveDailyStageSelectResponse,
	createStepUpBeginnerMissionListResponse,
	createWebviewThemeListResponse,
} from '../responses/app-content-response.ts';
import {
	getActivityRecordTop,
	playActivityRecordAdv,
	setActivityRecordWatchableStatus,
} from '../route-support/activity-record-handlers.ts';
import {
	apkDumpTypedEndpoint,
	typedEndpoint,
} from '../route-support/endpoint-source.ts';
import { getGiftShopList } from '../route-support/gift-shop-list-handler.ts';
import {
	ensureRouteUserDailyQuestState,
	ensureRouteUserLiveState,
	getRequestUserStepUpBeginnerMissionState,
} from '../route-support/request-user-state.ts';
import {
	getRequestUser,
	persistRouteStateIfChanged,
} from '../route-support/route-state.ts';
import type { StateRouteContext } from '../route-support/state-route-context.ts';

export function createAppContentRoutes(routeContext: StateRouteContext): Hono {
	const app = new Hono();

	typedEndpoint<EmptyRequest, ActivityRecordTopResponse>();
	app.post('/v1/activity_record/get_top', (c) =>
		getActivityRecordTop(c, routeContext),
	);

	apkDumpTypedEndpoint<
		ActivityRecordAdvRequest,
		ActivityRecordSetWatchableStatusResponse
	>();
	app.post('/v1/activity_record/set_watchable_status', (c) =>
		setActivityRecordWatchableStatus(c, routeContext),
	);

	typedEndpoint<ActivityRecordAdvRequest, ActivityRecordPlayAdvDataResponse>();
	app.post('/v1/activity_record/play_adv_data', (c) =>
		playActivityRecordAdv(c, routeContext),
	);

	typedEndpoint<WithliveGiftShopListRequest, GiftShopListResponse>({
		requiresSession: true,
	});
	app.post('/v1/withlive/get_gift_shop_list', async (c) => {
		return getGiftShopList(c, routeContext, 'withlive');
	});

	typedEndpoint<WithstationGiftShopListRequest, GiftShopListResponse>({
		requiresSession: true,
	});
	app.post('/v1/withstation/get_gift_shop_list', async (c) => {
		return getGiftShopList(c, routeContext, 'withstation');
	});

	typedEndpoint<EmptyRequest, WebviewThemeListResponse>();
	app.on(
		['GET', 'POST'],
		'/v1/webview/school_idol_connect_post/get_theme_list',
		(c) => {
			const user = getRequestUser(c, routeContext);
			if (user instanceof Response) {
				return user;
			}
			return c.json(createWebviewThemeListResponse());
		},
	);

	typedEndpoint<EmptyRequest, OutQuestLiveDailyStageSelectResponse>();
	app.post('/v1/out_quest_live/daily/get_stage_select', (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) {
			return user;
		}
		const dailyQuestResult = ensureRouteUserDailyQuestState(
			routeContext,
			user.playerId,
		);
		persistRouteStateIfChanged(routeContext, dailyQuestResult.created);
		return c.json(
			createOutQuestLiveDailyStageSelectResponse(
				dailyQuestResult.value,
				routeContext.date.nextGameDateBoundaryIsoDateTime(),
			),
		);
	});

	typedEndpoint<EmptyRequest, QuestTopWithMembersResponse>({
		requiresSession: true,
	});
	app.post('/v1/out_quest_live/get_quest_top', (c) => {
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) {
			return user;
		}
		const userLiveResult = ensureRouteUserLiveState(
			routeContext,
			user.playerId,
		);
		const userLive = userLiveResult.value;
		const database = routeContext.resolveMasterDatabase(c, user);
		const userCardsResult = ensureUserCards(
			routeContext.state,
			user.playerId,
			routeContext.userCardGetList,
		);
		const masterSupport = createUserOwnedMasterSupport(database);
		const userCards = projectUserCards(userCardsResult.value, masterSupport);
		const inventoryResult = ensureUserInventory(
			routeContext.state,
			user.playerId,
			routeContext.userItemsGetList,
		);
		const inventory = projectUserInventory(
			inventoryResult.value,
			masterSupport,
		);
		const userStatus = routeContext.resolveUserStatus(c, user);
		const statusResult = userStatus.ensure(routeContext.state, user.playerId);
		const status = statusResult.value;
		persistRouteStateIfChanged(
			routeContext,
			userLiveResult.created ||
				userCardsResult.created ||
				inventoryResult.created ||
				statusResult.created,
		);
		return c.json(
			applyStandardAreaLocks(
				database,
				applyDreamLiveMemberSelect(
					database,
					createQuestTopResponse(
						database,
						ensureGrandPrixRuntimeState(routeContext.state),
						ensureGradeChallengeRuntimeState(routeContext.state),
						ensureGradeLiveRuntimeState(routeContext.state),
						userLive,
					),
					userLive,
					userCards,
					inventory,
					userStatus.getCurrentSeasonMemberFanLevels(status),
				),
				userLive,
			),
		);
	});

	typedEndpoint<EmptyRequest, StepUpBeginnerMissionListResponse>();
	app.post('/v1/step_up_beginner_mission/get_list', (c) => {
		const missionResult = getRequestUserStepUpBeginnerMissionState(
			c,
			routeContext,
		);
		if (missionResult instanceof Response) {
			return missionResult;
		}
		persistRouteStateIfChanged(routeContext, missionResult.created);
		return c.json(createStepUpBeginnerMissionListResponse(missionResult.value));
	});

	return app;
}
