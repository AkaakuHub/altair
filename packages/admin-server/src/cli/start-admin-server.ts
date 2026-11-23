import { serve } from 'bun';
import { createStandaloneAdminApplication } from '../composition/create-standalone-admin-application.ts';
import {
	loadStandaloneAdminConfiguration,
	type StandaloneAdminConfiguration,
} from '../configuration/standalone-admin-config.ts';

export function startStandaloneAdminServer(
	configuration: StandaloneAdminConfiguration,
) {
	const app = createStandaloneAdminApplication(configuration);
	return serve({
		hostname: configuration.server.host,
		port: configuration.server.port,
		idleTimeout: 255,
		fetch: app.fetch,
	});
}

if (import.meta.main) {
	const server = startStandaloneAdminServer(loadStandaloneAdminConfiguration());
	console.log(`altair listening on ${server.url}`);
}
