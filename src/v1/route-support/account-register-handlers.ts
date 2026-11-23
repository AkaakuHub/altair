import type { Context } from 'hono';
import {
	createRegisteredUser,
	createUtcTimestamp,
	saveRegisteredUser,
} from '../../state/registered-user-state.ts';
import { readJson } from '../http/read-json.ts';
import type {
	ApproveTermsResponse,
	RegisterTermsResponse,
	UserCredentialsResponse,
} from '../response-types/account-response-types.ts';
import type { ResultResponse } from '../response-types/common-response-types.ts';
import { initializeNewUserState } from './new-user-state.ts';
import { getNumberField, getStringField } from './request-fields.ts';
import { persistRouteState, withRequestUser } from './route-state.ts';
import type { StateRouteContext } from './state-route-context.ts';
import { UNSET_BIRTHDAY } from './user-login-account-state.ts';

export function getRegisterTerms(
	c: Context,
	context: StateRouteContext,
): Response {
	context.applyResponseHeaders(c, context.defaultHeaders);
	return c.json({
		terms:
			'<!doctype html><html><head><meta charset="utf-8"></head><body><p>Link Like selfhost terms</p></body></html>',
	} satisfies RegisterTermsResponse);
}

export function approveRegisterTerms(
	c: Context,
	context: StateRouteContext,
): Response {
	const user = createRegisteredUser('selfhost', 1, UNSET_BIRTHDAY);
	initializeNewUserState(context, c, user);
	persistRouteState(context);
	context.applyResponseHeaders(c, context.defaultHeaders);
	return c.json({
		type: 0,
		player_id: user.playerId,
		device_specific_id: user.deviceSpecificId,
		session_token: user.sessionToken,
	} satisfies ApproveTermsResponse);
}

export function setRegisterApproveTerms(
	c: Context,
	context: StateRouteContext,
): Response {
	context.applyResponseHeaders(c, context.defaultHeaders);
	return c.json(null);
}

export async function setNewUser(
	c: Context,
	context: StateRouteContext,
): Promise<Response> {
	const body = await readJson(c.req.raw);
	const user = createRegisteredUser(
		getStringField(body, 'name') || 'selfhost',
		1,
		UNSET_BIRTHDAY,
	);
	user.platformType = getNumberField(body, 'platform_type') ?? 1;
	initializeNewUserState(context, c, user);
	persistRouteState(context);
	context.applyResponseHeaders(c, context.defaultHeaders);
	return c.json({
		device_specific_id: user.deviceSpecificId,
		player_id: user.playerId,
		session_token: user.sessionToken,
	} satisfies UserCredentialsResponse);
}

export async function setUserData(
	c: Context,
	context: StateRouteContext,
): Promise<Response> {
	return withRequestUser(c, context, async (requestUser) => {
		const playerName = getStringField(await readJson(c.req.raw), 'name');
		if (playerName.length > 0) {
			saveRegisteredUser(context.state, {
				...requestUser,
				playerName,
				lastLoginDate: createUtcTimestamp(),
			});
			persistRouteState(context);
		}
		return c.json({ result: true } satisfies ResultResponse);
	});
}
