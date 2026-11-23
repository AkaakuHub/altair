import { Hono } from 'hono';
import {
	ensureUserProfileDesign,
	updateProfileDesignEntry,
} from '../../state/profile-design-state.ts';
import { readJson } from '../http/read-json.ts';
import type { ResultResponse } from '../response-types/common-response-types.ts';
import type { EmptyRequest } from '../response-types/empty-request.ts';
import type {
	ProfileCardDesignRequest,
	ProfileDesignSelectionRequest,
	ProfileIconDesignRequest,
} from '../response-types/profile-request-types.ts';
import type { ProfileDesignListResponse } from '../response-types/profile-response-types.ts';
import { createProfileDesignListResponse } from '../responses/profile-response.ts';
import { typedEndpoint } from '../route-support/endpoint-source.ts';
import { handleProfileDesignSelection } from '../route-support/profile-design-selection-handler.ts';
import { getStringField } from '../route-support/request-fields.ts';
import {
	getRequestUser,
	persistRouteState,
	persistRouteStateIfChanged,
	withRequestUser,
} from '../route-support/route-state.ts';
import type { StateRouteContext } from '../route-support/state-route-context.ts';

export function createProfileDesignRoutes(
	routeContext: StateRouteContext,
): Hono {
	const app = new Hono();
	const { state } = routeContext;

	typedEndpoint<EmptyRequest, ProfileDesignListResponse>();
	app.post('/v1/profile/get_my_design_card_list', (c) =>
		withRequestUser(c, routeContext, (user) => {
			const result = ensureUserProfileDesign(state, user.playerId);
			persistRouteStateIfChanged(routeContext, result.created);
			return c.json(
				createProfileDesignListResponse(result.value.cardDesignList),
			);
		}),
	);
	typedEndpoint<EmptyRequest, ProfileDesignListResponse>();
	app.post('/v1/profile/get_my_design_icon_list', (c) =>
		withRequestUser(c, routeContext, (user) => {
			const result = ensureUserProfileDesign(state, user.playerId);
			persistRouteStateIfChanged(routeContext, result.created);
			return c.json(
				createProfileDesignListResponse(result.value.iconDesignList),
			);
		}),
	);

	typedEndpoint<ProfileIconDesignRequest, ResultResponse>();
	app.post('/v1/profile/set_my_design_icon', async (c) => {
		const body = await readJson(c.req.raw);
		const id = getStringField(body, 'd_profile_my_designs_id');
		const partsInfo = getStringField(body, 'profile_icon_parts_info');
		const name = getStringField(body, 'my_design_name');
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) return user;
		const design = ensureUserProfileDesign(state, user.playerId).value;
		if (
			id.length === 0 ||
			partsInfo.length === 0 ||
			name.length === 0 ||
			!updateProfileDesignEntry(design, 2, id, partsInfo, name)
		)
			return routeContext.respondError(c, 'profileDesignIconIdRequired');
		persistRouteState(routeContext);
		return c.json({ result: true } satisfies ResultResponse);
	});

	typedEndpoint<ProfileCardDesignRequest, ResultResponse>();
	app.post('/v1/profile/set_my_design_card', async (c) => {
		const body = await readJson(c.req.raw);
		const id = getStringField(body, 'd_profile_my_designs_id');
		const partsInfo = getStringField(body, 'profile_card_parts_info');
		const name = getStringField(body, 'my_design_name');
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) return user;
		const design = ensureUserProfileDesign(state, user.playerId).value;
		if (
			id.length === 0 ||
			partsInfo.length === 0 ||
			name.length === 0 ||
			!updateProfileDesignEntry(design, 1, id, partsInfo, name)
		)
			return routeContext.respondError(c, 'profileDesignCardIdRequired');
		routeContext
			.resolveMissionProgress(c, user)
			.apply({ type: 'profileCardSetting', playerId: user.playerId });
		persistRouteState(routeContext);
		return c.json({ result: true } satisfies ResultResponse);
	});

	typedEndpoint<ProfileDesignSelectionRequest, ResultResponse>();
	app.post('/v1/profile/set_profile_icon', async (c) =>
		handleProfileDesignSelection(c, routeContext, 2),
	);
	typedEndpoint<ProfileDesignSelectionRequest, ResultResponse>();
	app.post('/v1/profile/set_profile_card', async (c) =>
		handleProfileDesignSelection(c, routeContext, 1),
	);
	return app;
}
