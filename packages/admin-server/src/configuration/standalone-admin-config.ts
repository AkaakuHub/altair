import { loadConfig } from '../../../../src/config.ts';

export function loadStandaloneAdminConfiguration(
	environment: NodeJS.ProcessEnv = process.env,
) {
	return { server: loadConfig(environment) };
}

export type StandaloneAdminConfiguration = ReturnType<
	typeof loadStandaloneAdminConfiguration
>;
