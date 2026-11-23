import type { Hono } from 'hono';
import type { AdminRuntimeConfig } from '../../../../src/admin/configuration/runtimeConfig.ts';
import type { ServerState } from '../../../../src/server-state-schema.ts';
import {
	addCircleJoinRequestFromForm,
	addCircleMemberFromForm,
	approveCircleJoinRequestFromForm,
	changeCircleMemberPositionFromForm,
	deleteCircleFromForm,
	dismissCircleSubLeaderFromForm,
	expelCircleMemberFromForm,
	rejectCircleJoinRequestFromForm,
	removeCircleJoinRequestFromForm,
	removeCircleMemberFromForm,
	saveCircleFromForm,
	transferCircleLeaderFromForm,
} from '../forms/social/admin-circle-form.ts';
import {
	persistAdminState,
	redirectAdmin,
	registerAdminFormRoute,
} from '../route-support/admin-route-helpers.ts';

export function registerAdminCircleRoutes(
	app: Hono,
	config: AdminRuntimeConfig,
	state: ServerState,
): void {
	registerAdminFormRoute(
		app,
		'/circle',
		config,
		state,
		'invalid circle update',
		(form) => saveCircleFromForm(form, state),
	);
	app.post('/circle/delete', (c) => {
		deleteCircleFromForm(state);
		persistAdminState(config, state);
		return redirectAdmin(c);
	});
	registerAdminFormRoute(
		app,
		'/circle/member',
		config,
		state,
		'invalid circle member add',
		(form) => addCircleMemberFromForm(form, state),
	);
	registerAdminFormRoute(
		app,
		'/circle/member/delete',
		config,
		state,
		'invalid circle member delete',
		(form) => removeCircleMemberFromForm(form, state),
	);
	registerAdminFormRoute(
		app,
		'/circle/join-request',
		config,
		state,
		'invalid circle join request add',
		(form) => addCircleJoinRequestFromForm(form, state),
	);
	registerAdminFormRoute(
		app,
		'/circle/join-request/delete',
		config,
		state,
		'invalid circle join request delete',
		(form) => removeCircleJoinRequestFromForm(form, state),
	);
	registerAdminFormRoute(
		app,
		'/circle/approve-join',
		config,
		state,
		'invalid circle join approve',
		(form) => approveCircleJoinRequestFromForm(form, state),
	);
	registerAdminFormRoute(
		app,
		'/circle/reject-join',
		config,
		state,
		'invalid circle join reject',
		(form) => rejectCircleJoinRequestFromForm(form, state),
	);
	registerAdminFormRoute(
		app,
		'/circle/member/position',
		config,
		state,
		'invalid circle member position update',
		(form) => changeCircleMemberPositionFromForm(form, state),
	);
	registerAdminFormRoute(
		app,
		'/circle/member/dismissal',
		config,
		state,
		'invalid circle member dismissal',
		(form) => dismissCircleSubLeaderFromForm(form, state),
	);
	registerAdminFormRoute(
		app,
		'/circle/member/expulsion',
		config,
		state,
		'invalid circle member expulsion',
		(form) => expelCircleMemberFromForm(form, state),
	);
	registerAdminFormRoute(
		app,
		'/circle/member/transfer-leader',
		config,
		state,
		'invalid circle leader transfer',
		(form) => transferCircleLeaderFromForm(form, state),
	);
}
