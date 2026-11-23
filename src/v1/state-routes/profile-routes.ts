import { Hono } from 'hono';
import type { StateRouteContext } from '../route-support/state-route-context.ts';
import { createProfileDesignRoutes } from './profile-design-routes.ts';
import { createProfileFanLevelRoutes } from './profile-fan-level-routes.ts';
import { createProfileHomeRoutes } from './profile-home-routes.ts';
import { createProfileSettingsRoutes } from './profile-settings-routes.ts';
import { createProfileSocialRoutes } from './profile-social-routes.ts';

export function createProfileRoutes(routeContext: StateRouteContext): Hono {
	const app = new Hono();
	app.route('/', createProfileHomeRoutes(routeContext));
	app.route('/', createProfileSocialRoutes(routeContext));
	app.route('/', createProfileFanLevelRoutes(routeContext));
	app.route('/', createProfileDesignRoutes(routeContext));
	app.route('/', createProfileSettingsRoutes(routeContext));
	return app;
}
