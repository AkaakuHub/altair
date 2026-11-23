import type { AdminStateResponse } from '@altair/runtime/admin/dto/admin-state-response-schema.ts';
import type { RuntimeReleaseOption } from '@altair/runtime/admin/dto/runtime-resource-version-schema.ts';
import type { Hono } from 'hono';
import type { AppRouteWiring } from '../../../../src/server-composition/app-route-wiring.ts';
import type { StateRouteExtensions } from '../../../../src/v1/state-routes.ts';
import type { RuntimeSwitchJobLauncherPort } from '../runtime/application/runtime-switch-job-launcher-port.ts';

export type AdminStateResponseProjector = (
	response: AdminStateResponse,
	page: string,
) => AdminStateResponse;
export type AdminRouteOptions = Readonly<{
	stateRouteExtensions?: StateRouteExtensions;
	listReleaseOptions?: () => RuntimeReleaseOption[];
	runtimeSwitchLauncher: RuntimeSwitchJobLauncherPort;
	launchReleaseOptions?: (
		android: RuntimeReleaseOption,
		ios: RuntimeReleaseOption,
	) => Promise<void>;
	projectStateResponse?: AdminStateResponseProjector;
	additionalStatePages?: readonly string[];
	registerAdditionalRoutes?: (app: Hono, dependencies: AppRouteWiring) => void;
}>;
