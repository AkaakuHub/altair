import { randomUUID } from 'node:crypto';
import type { Context } from 'hono';
import { calculateFanLevel } from '../../state/fan-level-calculation.ts';
import { findRegisteredUser } from '../../state/registered-user-state.ts';
import { readJson } from '../http/read-json.ts';
import type { AccountConnectResponse } from '../response-types/account-response-types.ts';
import type { ResultResponse } from '../response-types/common-response-types.ts';
import { ensureHomeUserState } from './account-home-user-state.ts';
import {
	readAccountConnectRequest,
	readAccountLinkRequest,
} from './account-link-request.ts';
import { persistRouteState, withRequestUser } from './route-state.ts';
import type { StateRouteContext } from './state-route-context.ts';
import {
	deleteRegisteredUser,
	findAccountLink,
	saveAccountLink,
	updateUserLoginState,
} from './user-login-account-state.ts';

const ACCOUNT_LINK_PROVIDER = 1;

export async function setAccountConnectData(
	c: Context,
	context: StateRouteContext,
): Promise<Response> {
	return withRequestUser(c, context, async (requestUser) => {
		const request = readAccountLinkRequest(await readJson(c.req.raw));
		if (request.idToken.length === 0) {
			return context.respondError(c, 'accountLinkTargetNotFound');
		}
		if (request.provider !== ACCOUNT_LINK_PROVIDER) {
			return context.respondError(c, 'accountLinkTargetNotFound');
		}
		saveAccountLink(context.state, {
			provider: request.provider,
			playerId: requestUser.playerId,
			idToken: request.idToken,
			platformType: request.platformType ?? 1,
		});
		persistRouteState(context);
		context.applyResponseHeaders(c, context.defaultHeaders);
		return c.json({ result: true } satisfies ResultResponse);
	});
}

export async function connectAccount(
	c: Context,
	context: StateRouteContext,
): Promise<Response> {
	const request = readAccountConnectRequest(await readJson(c.req.raw));
	if (request.provider !== ACCOUNT_LINK_PROVIDER) {
		context.applyResponseHeaders(c, context.defaultHeaders);
		return invalidAccountLinkResponse(c);
	}
	const accountLink = findAccountLink(
		context.state,
		request.provider,
		request.playerId,
		request.idToken,
	);
	const user = accountLink
		? findRegisteredUser(context.state, request.playerId)
		: undefined;
	if (!accountLink || !user) {
		context.applyResponseHeaders(c, context.defaultHeaders);
		return invalidAccountLinkResponse(c);
	}
	const connectedUser = updateUserLoginState(
		context.state,
		user,
		randomUUID(),
		request.platformType ?? accountLink.platformType,
	);
	ensureHomeUserState(context, c, connectedUser.playerId);
	const status = context
		.resolveUserStatus(c, connectedUser)
		.ensure(context.state, connectedUser.playerId).value;
	persistRouteState(context);
	context.applyResponseHeaders(c, context.defaultHeaders, {
		user: connectedUser,
	});
	return c.json({
		device_specific_id: connectedUser.deviceSpecificId,
		player_id: connectedUser.playerId,
		player_level: calculateFanLevel(status.memberFanLevels),
		player_name: connectedUser.playerName,
		session_token: connectedUser.sessionToken,
	} satisfies AccountConnectResponse);
}

export function deleteAccount(
	c: Context,
	context: StateRouteContext,
): Response | Promise<Response> {
	return withRequestUser(c, context, (requestUser) => {
		deleteRegisteredUser(context.state, requestUser.playerId);
		persistRouteState(context);
		context.applyResponseHeaders(c, context.defaultHeaders);
		return c.json(null);
	});
}

function invalidAccountLinkResponse(c: Context): Response {
	return c.json(
		{
			error_code: '02008_300201',
			message: 'LinkLikeIDが間違っています。',
			title: 'ユーザー情報取得エラー',
		},
		400,
	);
}
