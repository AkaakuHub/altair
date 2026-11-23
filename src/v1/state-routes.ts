import { Hono } from 'hono';
import type { ServerRuntimeConfig } from '../config.ts';
import type { ServerState } from '../server-state-schema.ts';
import {
	createStateRouteContext,
	type StateRouteContext,
	type StateRouteDependencies,
	type StateRouteProjection,
} from './route-support/state-route-context.ts';
import { createAccountRoutes } from './state-routes/account-routes.ts';
import { createAppContentRoutes } from './state-routes/app-content-routes.ts';
import { createArchiveRoutes } from './state-routes/archive-routes.ts';
import { createChapterRoutes } from './state-routes/chapter-routes.ts';
import { createCircleRoutes } from './state-routes/circle-routes.ts';
import { createFesliveRoutes } from './state-routes/feslive-routes.ts';
import { createFollowRoutes } from './state-routes/follow-routes.ts';
import { createGachaRoutes } from './state-routes/gacha-routes.ts';
import { createNotificationRoutes } from './state-routes/notification-routes.ts';
import { createPresentRoutes } from './state-routes/present-routes.ts';
import { createProfileRoutes } from './state-routes/profile-routes.ts';
import { createQuestRoutes } from './state-routes/quest-routes.ts';
import { createShopRoutes } from './state-routes/shop-routes.ts';
import { createUserContentRoutes } from './state-routes/user-content-routes.ts';
import { createWithliveRoutes } from './state-routes/withlive-routes.ts';
import { createWithStationRoutes } from './state-routes/withstation-routes.ts';

export type StateRouteExtensions = StateRouteProjection & {
	register(app: Hono, context: StateRouteContext): void;
};

export function createStateRoutes(
	config: ServerRuntimeConfig,
	state: ServerState,
	dependencies: StateRouteDependencies,
	extensions?: StateRouteExtensions,
): Hono {
	const routeContext = createStateRouteContext(
		config,
		state,
		dependencies,
		extensions,
	);
	const app = new Hono();

	app.route('/', createAccountRoutes(routeContext));
	app.route('/', createArchiveRoutes(routeContext));
	app.route('/', createChapterRoutes(routeContext));
	app.route('/', createCircleRoutes(routeContext));
	app.route('/', createUserContentRoutes(routeContext));
	app.route('/', createAppContentRoutes(routeContext));
	app.route('/', createPresentRoutes(routeContext));
	app.route('/', createFollowRoutes(routeContext));
	app.route('/', createFesliveRoutes(routeContext));
	app.route('/', createGachaRoutes(routeContext));
	app.route('/', createProfileRoutes(routeContext));
	app.route('/', createNotificationRoutes(routeContext));
	app.route('/', createQuestRoutes(routeContext));
	app.route('/', createShopRoutes(routeContext));
	app.route('/', createWithStationRoutes(routeContext));
	app.route('/', createWithliveRoutes(routeContext));

	if (extensions === undefined) return app;

	const composition = new Hono();
	extensions.register(composition, routeContext);
	const registered = new Set(
		composition.routes.map((route) => `${route.method} ${route.path}`),
	);
	for (const route of app.routes) {
		if (!registered.has(`${route.method} ${route.path}`))
			composition.on(route.method, route.path, route.handler);
	}
	return composition;
}
