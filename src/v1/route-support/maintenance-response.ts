import { readFileSync } from 'node:fs';
import type { Context, MiddlewareHandler } from 'hono';
import {
	type RuntimeMaintenanceState,
	runtimeMaintenanceStateSchema,
} from '../../application/runtime-switch/runtime-maintenance-state.ts';
import {
	readResourceVersionRegistry,
	resolveResponseResourceVersion,
} from '../../resource-versions.ts';
import type { ServerState } from '../../server-state-schema.ts';

const officialMaintenanceBody = {
	error_code: '00004_000000',
	message:
		'ただいまメンテナンス中です。\nしばらく経ってからもう一度お試しください。',
	title: 'サーバーエラー',
};

export function createMaintenanceModeMiddleware(
	resourceVersionRegistryRoot: string,
	state: Pick<ServerState, 'maintenanceMode' | 'resourceVersionOverrides'>,
	runtimeMaintenanceStatePath: string,
): MiddlewareHandler {
	const resourceVersions = readResourceVersionRegistry(
		resourceVersionRegistryRoot,
	);
	return async (c, next) => {
		const runtimeMaintenance = readRuntimeMaintenanceState(
			runtimeMaintenanceStatePath,
		);
		if (!state.maintenanceMode.isEnabled && !runtimeMaintenance.enabled) {
			await next();
			return;
		}
		return createOfficialMaintenanceResponse(
			c,
			runtimeMaintenance.enabled
				? {
						android: runtimeMaintenance.androidResourceVersion,
						ios: runtimeMaintenance.iosResourceVersion,
					}
				: state.resourceVersionOverrides,
			resourceVersions,
		);
	};
}

function createOfficialMaintenanceResponse(
	c: Context,
	resourceVersionOverrides: ServerState['resourceVersionOverrides'],
	resourceVersions: ReturnType<typeof readResourceVersionRegistry>,
): Response {
	c.header(
		'x-res-version',
		resolveResponseResourceVersion(
			c.req.raw.headers,
			undefined,
			resourceVersions,
			resourceVersionOverrides,
		),
	);
	return c.json(officialMaintenanceBody, 503);
}

function readRuntimeMaintenanceState(path: string): RuntimeMaintenanceState {
	const value: unknown = JSON.parse(readFileSync(path, 'utf8'));
	const result = runtimeMaintenanceStateSchema.safeParse(value);
	if (!result.success)
		throw new Error(`Invalid runtime maintenance state: ${path}`);
	return result.data;
}
