import { createAdminUiRoutes } from '@altair/admin-ui/server/routes.ts';
import type { StandaloneAdminConfiguration } from '../configuration/standalone-admin-config.ts';
import { CommandRuntimeSwitchJobLauncher } from '../runtime/infrastructure/command-runtime-switch-job-launcher.ts';
import { createAdminApp } from '../server.ts';

export function createStandaloneAdminApplication(
	configuration: StandaloneAdminConfiguration,
) {
	const launcher = new CommandRuntimeSwitchJobLauncher({
		activeMasterDatabasePath: configuration.server.activeMasterDatabasePath,
		command: configuration.runtimeSwitchCommand,
	});
	return createAdminApp(configuration.server, () => ({
		runtimeSwitchLauncher: launcher,
	})).route('/admin', createAdminUiRoutes());
}
