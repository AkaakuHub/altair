import type { Context } from 'hono';
import { findRegisteredUser } from '../../state/registered-user-state.ts';
import { ensureUserTutorialState } from '../../state/user-tutorial-state.ts';
import { readJson } from '../http/read-json.ts';
import { ensureHomeUserState } from './account-home-user-state.ts';
import { refreshLoginBonusSession } from './login-bonus-flow.ts';
import { getStringField } from './request-fields.ts';
import { persistRouteState } from './route-state.ts';
import type { StateRouteContext } from './state-route-context.ts';
import {
	createExistingUserLoginResponse,
	createNewUserLoginResponse,
	hasPlayerId,
	updateUserLoginState,
} from './user-login-account-state.ts';

export async function loginUser(
	c: Context,
	context: StateRouteContext,
): Promise<Response> {
	const body = await readJson(c.req.raw);
	context.applyResponseHeaders(c, context.userLoginHeaders);
	context.state.sessionIssueCount += 1;
	if (!hasPlayerId(body)) {
		persistRouteState(context);
		return c.json(createNewUserLoginResponse());
	}
	const user = findRegisteredUser(
		context.state,
		getStringField(body, 'player_id'),
	);
	if (!user) {
		persistRouteState(context);
		return c.json(
			{
				error_code: '00300_101709',
				message: 'ユーザーデータがありません。',
				title: 'エラー',
			},
			401,
		);
	}
	const loggedInUser = updateUserLoginState(
		context.state,
		user,
		getStringField(body, 'device_specific_id'),
	);
	ensureHomeUserState(context, c, loggedInUser.playerId);
	const tutorial = ensureUserTutorialState(
		context.state,
		loggedInUser.playerId,
	).value;
	const session = refreshLoginBonusSession(context, c, loggedInUser);
	persistRouteState(context);
	return c.json(
		createExistingUserLoginResponse(loggedInUser, session, tutorial),
	);
}
