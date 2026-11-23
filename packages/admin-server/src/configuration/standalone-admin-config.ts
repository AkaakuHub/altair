import { z } from 'zod';
import { loadConfig } from '../../../../src/config.ts';
import type { AdminServerConfig } from '../server.ts';

const optionsSchema = z.object({
	RUNTIME_SWITCH_COMMAND: z
		.string()
		.transform((value, context) => {
			try {
				const command: unknown = JSON.parse(value);
				return command;
			} catch {
				context.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Runtime switch command must be a JSON array',
				});
				return z.NEVER;
			}
		})
		.pipe(z.tuple([z.string().min(1)]).rest(z.string().min(1))),
});

export function loadStandaloneAdminOptions(
	environment: NodeJS.ProcessEnv = process.env,
) {
	const parsed = optionsSchema.parse(environment);
	return {
		runtimeSwitchCommand: parsed.RUNTIME_SWITCH_COMMAND,
	};
}

export type StandaloneAdminConfiguration = Readonly<{
	server: AdminServerConfig;
}> &
	ReturnType<typeof loadStandaloneAdminOptions>;

export function loadStandaloneAdminConfiguration(
	environment: NodeJS.ProcessEnv = process.env,
): StandaloneAdminConfiguration {
	return {
		server: loadConfig(environment),
		...loadStandaloneAdminOptions(environment),
	};
}
