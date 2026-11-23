import { type Context, Hono } from 'hono';
import { getActivityRecordSeriesProvenanceFromDatabase } from '../../master-data/activity-record-master.ts';
import { markActivityRecordMonthDisplayed } from '../../state/activity-record-mutation.ts';
import {
	ensureUserProfileSettings,
	setHomeWallpaperSetting,
} from '../../state/profile-settings-state.ts';
import { retireCurrentRhythmGame } from '../../state/rhythm-game/current-session.ts';
import { recordUserNotification } from '../../state/user-notifications-state.ts';
import { readJson } from '../http/read-json.ts';
import type { NullResponse } from '../response-types/common-response-types.ts';
import type { EmptyRequest } from '../response-types/empty-request.ts';
import type {
	MonthDisplayedRequest,
	WallpaperSettingRequest,
} from '../response-types/notification-request-types.ts';
import { typedEndpoint } from '../route-support/endpoint-source.ts';
import { getNumberField } from '../route-support/request-fields.ts';
import { ensureRouteUserActivityRecordState } from '../route-support/request-user-state.ts';
import {
	persistRouteState,
	withRequestUser,
} from '../route-support/route-state.ts';
import type { StateRouteContext } from '../route-support/state-route-context.ts';

export function createNotificationRoutes(
	routeContext: StateRouteContext,
): Hono {
	const app = new Hono();
	const { state } = routeContext;

	const handleNotification = async (c: Context) => {
		const path = c.req.routePath;
		return withRequestUser(c, routeContext, async (user) => {
			const missionProgress = routeContext.resolveMissionProgress(c, user);
			const body = await readJson(c.req.raw);
			if (path === '/v1/rhythm_game_live/set_retire') {
				retireCurrentRhythmGame(state, user.playerId);
			}
			if (path === '/v1/activity_record/notify_month_displayed') {
				const advSeriesId = getNumberField(body, 'adv_series_id');
				if (advSeriesId !== undefined) {
					const masterRelease = routeContext.resolveRequestMasterRelease(
						c,
						user,
					);
					const provenance = getActivityRecordSeriesProvenanceFromDatabase(
						masterRelease.database,
						masterRelease.masterReleaseId,
						advSeriesId,
					);
					if (provenance !== undefined) {
						markActivityRecordMonthDisplayed(
							ensureRouteUserActivityRecordState(routeContext, user.playerId)
								.value,
							advSeriesId,
							provenance,
						);
					}
				}
			}
			if (path === '/v1/home/notify_wallpaper_setting') {
				const updated = setHomeWallpaperSetting(
					ensureUserProfileSettings(state, user.playerId).value,
					body,
				);
				if (updated) {
					missionProgress.apply({
						type: 'homeWallpaperSetting',
						playerId: user.playerId,
					});
				}
			}
			recordUserNotification(state, user.playerId, path);
			persistRouteState(routeContext);
			return c.json(null);
		});
	};

	typedEndpoint<EmptyRequest, NullResponse>({ requiresSession: true });
	app.post('/v1/user/deck/notify_auto_deck', handleNotification);

	app.post('/v1/rhythm_game/receive_class_mission', handleNotification);

	typedEndpoint<EmptyRequest, NullResponse>({ requiresSession: true });
	app.post('/v1/rhythm_game_live/set_retire', handleNotification);

	typedEndpoint<MonthDisplayedRequest, NullResponse>({ requiresSession: true });
	app.post('/v1/activity_record/notify_month_displayed', handleNotification);

	typedEndpoint<WallpaperSettingRequest, NullResponse>({
		requiresSession: true,
	});
	app.post('/v1/home/notify_wallpaper_setting', handleNotification);

	return app;
}
