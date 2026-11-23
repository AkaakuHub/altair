import { Hono } from 'hono';
import type {
	AccountConnectRequest,
	AccountConnectResponse,
	ApproveTermsResponse,
	RegisterTermsResponse,
	RegisterUserRequest,
	SetAccountConnectDataRequest,
	SetPushDeviceTokenRequest,
	SetTutorialStepRequest,
	SetUserDataRequest,
	UserCredentialsResponse,
	UserLoginRequest,
	UserLoginResponse,
} from '../response-types/account-response-types.ts';
import type { LoginBonusResponse } from '../response-types/archive-chapter-login-response-types.ts';
import type {
	NullResponse,
	ResultResponse,
} from '../response-types/common-response-types.ts';
import type { EmptyRequest } from '../response-types/empty-request.ts';
import type {
	HomeSetShowRetireRequest,
	HomeSetShowRetireResponse,
} from '../response-types/home-retire-response.ts';
import type { ProfileTargetRequest } from '../response-types/profile-request-types.ts';
import type { HomeGetHomeResponse } from '../responses/home-response.ts';
import type { ProfileInfoResponse } from '../responses/profile-response.ts';
import {
	getHome,
	getLoginBonus,
} from '../route-support/account-home-handlers.ts';
import {
	connectAccount,
	deleteAccount,
	setAccountConnectData,
} from '../route-support/account-link-handlers.ts';
import { loginUser } from '../route-support/account-login-handlers.ts';
import { getProfileInfo } from '../route-support/account-profile-handlers.ts';
import {
	approveRegisterTerms,
	getRegisterTerms,
	setNewUser,
	setRegisterApproveTerms,
	setUserData,
} from '../route-support/account-register-handlers.ts';
import { setTutorialStep } from '../route-support/account-tutorial-handlers.ts';
import {
	apkDumpTypedEndpoint,
	typedEndpoint,
} from '../route-support/endpoint-source.ts';
import { acknowledgeHomeRetire } from '../route-support/home-retire-acknowledgement.ts';
import { setRequestUserPushDeviceToken } from '../route-support/push-device-token.ts';
import type { StateRouteContext } from '../route-support/state-route-context.ts';

export function createAccountRoutes(routeContext: StateRouteContext): Hono {
	const app = new Hono();

	typedEndpoint<UserLoginRequest, UserLoginResponse>();
	app.post('/v1/user/login', (c) => loginUser(c, routeContext));
	typedEndpoint<EmptyRequest, RegisterTermsResponse>();
	app.post('/v1/register/get_terms', (c) => getRegisterTerms(c, routeContext));
	typedEndpoint<EmptyRequest, ApproveTermsResponse>();
	app.post('/v1/register/approve_terms', (c) =>
		approveRegisterTerms(c, routeContext),
	);
	typedEndpoint<EmptyRequest, NullResponse>();
	app.post('/v1/register/set_approve_terms', (c) =>
		setRegisterApproveTerms(c, routeContext),
	);
	typedEndpoint<RegisterUserRequest, UserCredentialsResponse>();
	app.post('/v1/register/set_new_user', (c) => setNewUser(c, routeContext));
	typedEndpoint<SetUserDataRequest, ResultResponse>();
	app.post('/v1/register/set_user_data', (c) => setUserData(c, routeContext));
	typedEndpoint<SetAccountConnectDataRequest, ResultResponse>();
	app.post('/v1/account/set_connect_data', (c) =>
		setAccountConnectData(c, routeContext),
	);
	typedEndpoint<AccountConnectRequest, AccountConnectResponse>();
	app.post('/v1/account/connect', (c) => connectAccount(c, routeContext));
	typedEndpoint<EmptyRequest, NullResponse>();
	app.post('/v1/account/delete', (c) => deleteAccount(c, routeContext));
	typedEndpoint<SetTutorialStepRequest, ResultResponse>();
	app.post('/v1/tutorial/set_step', (c) => setTutorialStep(c, routeContext));
	typedEndpoint<EmptyRequest, LoginBonusResponse>();
	app.post('/v1/home/get_login_bonus', (c) => getLoginBonus(c, routeContext));
	typedEndpoint<EmptyRequest, HomeGetHomeResponse>();
	app.post('/v1/home/get_home', (c) => getHome(c, routeContext));
	apkDumpTypedEndpoint<HomeSetShowRetireRequest, HomeSetShowRetireResponse>();
	app.post('/v1/home/set_show_retire', (c) =>
		acknowledgeHomeRetire(c, routeContext),
	);
	typedEndpoint<SetPushDeviceTokenRequest, NullResponse>();
	app.post('/v1/user/push/devices', (c) =>
		setRequestUserPushDeviceToken(c, routeContext),
	);
	typedEndpoint<SetPushDeviceTokenRequest, NullResponse>();
	app.post('/v1/user/push/device', (c) =>
		setRequestUserPushDeviceToken(c, routeContext),
	);
	typedEndpoint<SetPushDeviceTokenRequest, NullResponse>();
	app.put('/v1/user/push/device', (c) =>
		setRequestUserPushDeviceToken(c, routeContext),
	);
	typedEndpoint<ProfileTargetRequest, ProfileInfoResponse>();
	app.post('/v1/profile/get_info', (c) => getProfileInfo(c, routeContext));
	return app;
}
