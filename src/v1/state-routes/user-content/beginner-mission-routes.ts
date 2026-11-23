import { Hono } from 'hono';
import type { NullResponse } from '../../response-types/common-response-types.ts';
import type { EmptyRequest } from '../../response-types/empty-request.ts';
import type {
	MissionIdRequest,
	MissionTypeRequest,
} from '../../response-types/mission-request-types.ts';
import type {
	BeginnerMissionListResponse,
	BeginnerMissionRewardAllResponse,
} from '../../response-types/mission-response-types.ts';
import { createBeginnerMissionListHandler } from '../../route-support/beginner-mission-list-handler.ts';
import { createBeginnerMissionSetBannerRewardHandler } from '../../route-support/beginner-mission-set-banner-reward-handler.ts';
import { createBeginnerMissionSetRewardAllHandler } from '../../route-support/beginner-mission-set-reward-all-handler.ts';
import { createBeginnerMissionSetRewardHandler } from '../../route-support/beginner-mission-set-reward-handler.ts';
import { typedEndpoint } from '../../route-support/endpoint-source.ts';
import type { StateRouteContext } from '../../route-support/state-route-context.ts';

export function createBeginnerMissionRoutes(
	routeContext: StateRouteContext,
): Hono {
	const app = new Hono();
	typedEndpoint<EmptyRequest, BeginnerMissionListResponse>({
		requiresSession: true,
	});
	app.post(
		'/v1/beginner_mission/get_list',
		createBeginnerMissionListHandler(routeContext),
	);
	typedEndpoint<MissionTypeRequest, BeginnerMissionRewardAllResponse>({
		requiresSession: true,
	});
	app.post(
		'/v1/beginner_mission/set_reward_all',
		createBeginnerMissionSetRewardAllHandler(routeContext),
	);
	typedEndpoint<MissionIdRequest, NullResponse>({ requiresSession: true });
	app.post(
		'/v1/beginner_mission/set_reward',
		createBeginnerMissionSetRewardHandler(routeContext),
	);
	typedEndpoint<MissionTypeRequest, NullResponse>({ requiresSession: true });
	app.post(
		'/v1/beginner_mission/set_banner_reward',
		createBeginnerMissionSetBannerRewardHandler(routeContext),
	);
	return app;
}
