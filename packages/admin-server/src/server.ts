import type { Hono } from 'hono';
import type { ServerConfig } from '../../../src/config.ts';
import { createApp } from '../../../src/server.ts';
import type { AppRouteWiring } from '../../../src/server-composition/app-route-wiring.ts';
import type { AdminRouteOptions } from './composition/admin-route-options.ts';
import { createAdminRoutes } from './composition/create-admin-routes.ts';

export type AdminServerConfig = ServerConfig;

export function createAdminApp(
	config: AdminServerConfig,
	createOptions: (dependencies: AppRouteWiring) => AdminRouteOptions,
): Hono {
	return createApp(config, (app, dependencies) => {
		const options = createOptions(dependencies);
		app.route(
			'/admin',
			createAdminRoutes(
				{ ...config, ...dependencies.runtimeConfig },
				dependencies,
				options,
			),
		);
		return options.stateRouteExtensions;
	});
}
