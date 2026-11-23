import type { Database } from 'bun:sqlite';
import type { Hono } from 'hono';
import type { AdminRuntimeConfig } from '../../../../src/admin/configuration/runtimeConfig.ts';
import type {
	UserStatusController,
	UserStatusControllerProvider,
} from '../../../../src/application/user-status-controller.ts';
import type { ServerState } from '../../../../src/server-state-schema.ts';
import {
	addFollowRelationFromForm,
	addRegisteredUserFromForm,
	setSelectedAdminUserFromForm,
	updateAccountLinkFromForm,
	updateRegisteredUserFromForm,
} from '../forms/user/admin-user-form.ts';
import { updateUserStatusFromForm } from '../forms/user/admin-user-status-form.ts';
import {
	applyWithAdminFormPlayerDependency,
	registerAdminFormRoute,
} from '../route-support/admin-route-helpers.ts';

export function registerAdminUserRoutes(
	app: Hono,
	config: AdminRuntimeConfig,
	state: ServerState,
	resolveUserMasterDatabase: (playerId: string) => Database,
	resolveUserStatus: (playerId: string) => UserStatusController,
	resolveNewUserStatus: UserStatusControllerProvider,
): void {
	registerAdminFormRoute(
		app,
		'/user-status',
		config,
		state,
		'invalid user status update',
		(form) =>
			applyWithAdminFormPlayerDependency(
				form,
				resolveUserMasterDatabase,
				(database, playerId) =>
					updateUserStatusFromForm(
						form,
						state,
						resolveUserStatus(playerId),
						database,
					),
			),
	);
	registerAdminFormRoute(
		app,
		'/follow',
		config,
		state,
		'invalid follow add',
		(form) => addFollowRelationFromForm(form, state),
	);
	registerAdminFormRoute(
		app,
		'/selected-user',
		config,
		state,
		'invalid selected user',
		(form) => setSelectedAdminUserFromForm(form, state),
	);
	registerAdminFormRoute(
		app,
		'/registered-user/add',
		config,
		state,
		'invalid registered user add',
		(form) => addRegisteredUserFromForm(form, state, resolveNewUserStatus()),
	);
	registerAdminFormRoute(
		app,
		'/registered-user',
		config,
		state,
		'invalid registered user update',
		(form) => updateRegisteredUserFromForm(form, state),
	);
	registerAdminFormRoute(
		app,
		'/account-link',
		config,
		state,
		'invalid account link update',
		(form) => updateAccountLinkFromForm(form, state),
	);
}
