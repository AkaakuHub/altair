import { type ServerState, serverStateSchema } from './server-state-schema.ts';

export function parseServerState(value: unknown): ServerState | undefined {
	const parsed = serverStateSchema.safeParse(value);
	return parsed.success ? parsed.data : undefined;
}
