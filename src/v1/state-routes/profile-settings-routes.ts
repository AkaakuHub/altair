import { Hono } from 'hono';
import { projectUserCards } from '../../application/user-owned-master-projection.ts';
import { getCardIdentityFingerprint } from '../../master-data/entity-identity-fingerprints.ts';
import { createUserOwnedMasterSupport } from '../../master-data/user-owned-master-support.ts';
import { isSameEntityIdentity } from '../../state/entity-provenance.ts';
import {
	ensureUserProfileSettings,
	setSimpleTutorialFinished,
} from '../../state/profile-settings-state.ts';
import { saveRegisteredUser } from '../../state/registered-user-state.ts';
import {
	cardDatasIdToSeriesId,
	ensureUserCards,
	hasUserCardSeries,
} from '../../state/user-card-aggregate-state.ts';
import { readJson } from '../http/read-json.ts';
import type {
	NullResponse,
	ResultResponse,
} from '../response-types/common-response-types.ts';
import type { ContentIdRequest } from '../response-types/content-request-types.ts';
import type {
	CardDisplayRequest,
	ProfileCommentRequest,
	ProfileNameRequest,
} from '../response-types/profile-request-types.ts';
import type { CardDisplayResponse } from '../response-types/profile-response-types.ts';
import { typedEndpoint } from '../route-support/endpoint-source.ts';
import {
	getNumberField,
	getStringField,
} from '../route-support/request-fields.ts';
import {
	getRequestUser,
	persistRouteState,
} from '../route-support/route-state.ts';
import type { StateRouteContext } from '../route-support/state-route-context.ts';

export function createProfileSettingsRoutes(
	routeContext: StateRouteContext,
): Hono {
	const app = new Hono();
	const { defaultHeaders, state, userCardGetList } = routeContext;

	typedEndpoint<ProfileCommentRequest, ResultResponse>();
	app.post('/v1/profile/set_comment', async (c) => {
		const comment = getStringField(await readJson(c.req.raw), 'comment');
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) return user;
		ensureUserProfileSettings(state, user.playerId).value.comment = comment;
		persistRouteState(routeContext);
		return c.json({ result: true } satisfies ResultResponse);
	});

	typedEndpoint<ProfileNameRequest, ResultResponse>();
	app.post('/v1/profile/set_name', async (c) => {
		const playerName = getStringField(await readJson(c.req.raw), 'name');
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) return user;
		if (playerName.length === 0)
			return routeContext.respondError(c, 'profileNameRequired');
		saveRegisteredUser(state, { ...user, playerName });
		persistRouteState(routeContext);
		routeContext.applyResponseHeaders(c, defaultHeaders);
		return c.json({ result: true } satisfies ResultResponse);
	});

	typedEndpoint<CardDisplayRequest, CardDisplayResponse>();
	app.post('/v1/card/set_display_data', async (c) => {
		const body = await readJson(c.req.raw);
		const baseCardSeriesId = getNumberField(body, 'base_card_series_id');
		const displayCardId = getNumberField(body, 'display_card_id');
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) return user;
		if (
			baseCardSeriesId === undefined ||
			displayCardId === undefined ||
			cardDatasIdToSeriesId(displayCardId) !== baseCardSeriesId
		)
			return routeContext.respondError(c, 'displayCardIdRequired');
		const masterRelease = routeContext.resolveRequestMasterRelease(c, user);
		const database = masterRelease.database;
		const identityFingerprint = getCardIdentityFingerprint(
			database,
			displayCardId,
		);
		const cards = projectUserCards(
			ensureUserCards(state, user.playerId, userCardGetList).value,
			createUserOwnedMasterSupport(database),
		);
		if (
			identityFingerprint === undefined ||
			!hasUserCardSeries(cards, baseCardSeriesId)
		)
			return routeContext.respondError(c, 'userCardNotFound');
		const settings = ensureUserProfileSettings(state, user.playerId).value;
		const beforeIdentityFingerprint =
			settings.displayCardDatasId === null
				? undefined
				: getCardIdentityFingerprint(database, settings.displayCardDatasId);
		const beforeDisplayCardId =
			settings.displayCardDatasId !== null &&
			beforeIdentityFingerprint !== undefined &&
			(settings.displayCardIdentityFingerprint === undefined ||
				isSameEntityIdentity(
					settings.displayCardIdentityFingerprint,
					beforeIdentityFingerprint,
				))
				? settings.displayCardDatasId
				: 0;
		settings.displayCardDatasId = displayCardId;
		settings.displayCardDataId = '';
		settings.displayCardSourceMasterReleaseId = masterRelease.masterReleaseId;
		settings.displayCardIdentityFingerprint = identityFingerprint;
		persistRouteState(routeContext);
		return c.json({
			base_card_series_id: baseCardSeriesId,
			before_display_card_id: beforeDisplayCardId,
			after_display_card_id: displayCardId,
		} satisfies CardDisplayResponse);
	});

	typedEndpoint<ContentIdRequest, NullResponse>();
	app.post('/v1/user/set_simple_tutorial_finish', async (c) => {
		const contentsId = getNumberField(await readJson(c.req.raw), 'contents_id');
		const user = getRequestUser(c, routeContext);
		if (user instanceof Response) return user;
		if (contentsId === undefined)
			return routeContext.respondError(c, 'contentsIdRequired');
		setSimpleTutorialFinished(
			ensureUserProfileSettings(state, user.playerId).value,
			contentsId,
			true,
		);
		persistRouteState(routeContext);
		return c.json(null);
	});

	return app;
}
