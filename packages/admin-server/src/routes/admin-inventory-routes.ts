import type { Hono } from 'hono';
import type { AdminRuntimeConfig } from '../../../../src/admin/configuration/runtimeConfig.ts';
import type { UserStatusController } from '../../../../src/application/user-status-controller.ts';
import type { ActiveMasterRouteSelection as MasterDatabaseSelection } from '../../../../src/master-data/active-master-repository.ts';
import type { ServerState } from '../../../../src/server-state-schema.ts';
import {
	registerAdminArchiveRoutes,
	registerAdminStickerRoutes,
} from './admin-archive-sticker-routes.ts';
import { registerAdminCardRoutes } from './admin-card-routes.ts';
import type { AdminInventoryRouteContext } from './admin-inventory-route-context.ts';
import { registerAdminItemRoutes } from './admin-item-routes.ts';
import { registerAdminLiveProgressRoutes } from './admin-live-progress-routes.ts';
import { registerAdminPresentRoutes } from './admin-present-routes.ts';

export function registerAdminInventoryRoutes(
	app: Hono,
	config: AdminRuntimeConfig,
	state: ServerState,
	resolveUserMasterSelection: (playerId: string) => MasterDatabaseSelection,
	resolveUserStatus: (playerId: string) => UserStatusController,
): void {
	const context: AdminInventoryRouteContext = {
		app,
		config,
		state,
		resolveUserMasterSelection,
		resolveUserStatus,
	};
	registerAdminItemRoutes(context);
	registerAdminCardRoutes(context);
	registerAdminStickerRoutes(context);
	registerAdminLiveProgressRoutes(context);
	registerAdminArchiveRoutes(context);
	registerAdminPresentRoutes(context);
}
