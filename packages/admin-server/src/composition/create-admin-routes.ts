import type { AdminRouteOptions } from '@altair/admin-server/composition/admin-route-options.ts';
import { createOfficialDataMigrationDumpReader } from '@altair/admin-server/official-data-migration/infrastructure/official-data-migration-dump.ts';
import { registerAdminActivityRecordRoutes } from '@altair/admin-server/routes/admin-activity-record-routes.ts';
import { registerAdminCircleRoutes } from '@altair/admin-server/routes/admin-circle-routes.ts';
import { registerAdminGachaRoutes } from '@altair/admin-server/routes/admin-gacha-routes.ts';
import { registerAdminInventoryRoutes } from '@altair/admin-server/routes/admin-inventory-routes.ts';
import { registerAdminOfficialDataMigrationRoutes } from '@altair/admin-server/routes/admin-official-data-migration-routes.ts';
import { registerAdminOnboardingRoutes } from '@altair/admin-server/routes/admin-onboarding-routes.ts';
import { registerAdminPageRoutes } from '@altair/admin-server/routes/admin-page-routes.ts';
import { registerAdminSocialRoutes } from '@altair/admin-server/routes/admin-social-routes.ts';
import { registerAdminSystemRoutes } from '@altair/admin-server/routes/admin-system-routes.ts';
import { registerAdminUserRoutes } from '@altair/admin-server/routes/admin-user-routes.ts';
import { registerAdminRuntimeSwitchRoutes } from '@altair/admin-server/runtime/presentation/admin-runtime-switch-routes.ts';
import { Hono } from 'hono';
import type { AdminRuntimeConfig } from '../../../../src/admin/configuration/runtimeConfig.ts';
import type { AppRouteWiring } from '../../../../src/server-composition/app-route-wiring.ts';
import { listRuntimeReleaseOptions } from '../runtime/application/admin-resource-version-options.ts';

export function createAdminRoutes(
	config: AdminRuntimeConfig,
	dependencies: AppRouteWiring,
	options: AdminRouteOptions,
): Hono {
	const { state, activeMaster, masterResolvers, getUserStatusController } =
		dependencies;
	const resolveCurrentMasterDatabase = masterResolvers.resolveCurrent;
	const resolveSelectedAdminUserMasterDatabase =
		masterResolvers.resolveSelectedAdminUser;
	const resolveAdminUserMasterDatabase = masterResolvers.resolveAdminUser;
	const resolveAdminUserMasterSelection =
		masterResolvers.resolveAdminUserSelection;
	const resolveUserStatus = () =>
		getUserStatusController(masterResolvers.resolveSelectedAdminUser());
	const resolveAdminUserStatus = () =>
		getUserStatusController(masterResolvers.resolveAdminUser());
	const app = new Hono();
	const resourceVersions = dependencies.resourceVersions;
	const listReleaseOptions =
		options.listReleaseOptions ??
		(() => listRuntimeReleaseOptions(resourceVersions, activeMaster));

	registerAdminPageRoutes(
		app,
		config,
		state,
		resolveCurrentMasterDatabase,
		resolveSelectedAdminUserMasterDatabase,
		resolveAdminUserMasterSelection,
		resolveUserStatus,
		listReleaseOptions,
		options.projectStateResponse,
		options.additionalStatePages,
	);
	registerAdminSystemRoutes(
		app,
		config,
		state,
		resourceVersions,
		activeMaster,
		resolveCurrentMasterDatabase,
	);
	registerAdminInventoryRoutes(
		app,
		config,
		state,
		resolveAdminUserMasterSelection,
		resolveAdminUserStatus,
	);

	registerAdminCircleRoutes(app, config, state);
	registerAdminUserRoutes(
		app,
		config,
		state,
		resolveAdminUserMasterDatabase,
		resolveAdminUserStatus,
		resolveUserStatus,
	);
	registerAdminOnboardingRoutes(
		app,
		config,
		state,
		resolveAdminUserMasterSelection,
	);
	registerAdminGachaRoutes(app, config, state, resolveAdminUserMasterSelection);
	registerAdminActivityRecordRoutes(
		app,
		config,
		state,
		resolveAdminUserMasterSelection,
	);
	registerAdminSocialRoutes(app, config, state);
	registerAdminOfficialDataMigrationRoutes(
		app,
		config,
		state,
		resolveUserStatus,
		createOfficialDataMigrationDumpReader(),
		resolveCurrentMasterDatabase,
	);
	registerAdminRuntimeSwitchRoutes(
		app,
		options.runtimeSwitchLauncher,
		listReleaseOptions,
		options.launchReleaseOptions,
	);
	options.registerAdditionalRoutes?.(app, dependencies);
	return app;
}
