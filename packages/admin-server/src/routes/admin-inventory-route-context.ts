import type { Hono } from 'hono';
import type { AdminRuntimeConfig } from '../../../../src/admin/configuration/runtimeConfig.ts';
import type { UserStatusController } from '../../../../src/application/user-status-controller.ts';
import type { ActiveMasterRouteSelection as MasterDatabaseSelection } from '../../../../src/master-data/active-master-repository.ts';
import type { ServerState } from '../../../../src/server-state-schema.ts';
import { applyWithAdminFormPlayerDependency } from '../route-support/admin-route-helpers.ts';

export interface AdminInventoryRouteContext {
	app: Hono;
	config: AdminRuntimeConfig;
	state: ServerState;
	resolveUserMasterSelection: (playerId: string) => MasterDatabaseSelection;
	resolveUserStatus: (playerId: string) => UserStatusController;
}

type AdminForm = Parameters<typeof applyWithAdminFormPlayerDependency>[0];

export function applyWithUserMasterSelection(
	context: AdminInventoryRouteContext,
	form: AdminForm,
	apply: (
		selection: MasterDatabaseSelection,
		userStatus: UserStatusController,
	) => boolean,
): boolean {
	return applyWithAdminFormPlayerDependency(
		form,
		context.resolveUserMasterSelection,
		(selection, playerId) =>
			apply(selection, context.resolveUserStatus(playerId)),
	);
}

export function applyWithUserMaster(
	context: AdminInventoryRouteContext,
	form: AdminForm,
	apply: (database: Database, userStatus: UserStatusController) => boolean,
): boolean {
	return applyWithAdminFormPlayerDependency(
		form,
		(playerId) => context.resolveUserMasterSelection(playerId).database,
		(database, playerId) =>
			apply(database, context.resolveUserStatus(playerId)),
	);
}

import type { Database } from 'bun:sqlite';
