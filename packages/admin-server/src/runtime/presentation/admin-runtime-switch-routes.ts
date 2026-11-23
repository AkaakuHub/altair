import { getFormString } from '@altair/admin-server/forms/shared/admin-form-values.ts';
import {
	parseAdminForm,
	redirectAdmin,
} from '@altair/admin-server/route-support/admin-route-helpers.ts';
import { findRuntimeReleaseOption } from '@altair/admin-server/runtime/application/admin-resource-version-options.ts';
import type { RuntimeSwitchJobLauncherPort } from '@altair/admin-server/runtime/application/runtime-switch-job-launcher-port.ts';
import type { RuntimeReleaseOption } from '@altair/runtime/admin/dto/runtime-resource-version-schema.ts';
import type { Hono } from 'hono';
import type { RuntimeResourceSelection } from '../../../../../src/application/runtime-switch/runtime-resource-selection-schema.ts';

export function registerAdminRuntimeSwitchRoutes(
	app: Hono,
	launcher: RuntimeSwitchJobLauncherPort,
	listReleaseOptions: () => readonly RuntimeReleaseOption[],
	launchReleaseOptions = (
		android: RuntimeReleaseOption,
		ios: RuntimeReleaseOption,
	) => launcher.launch({ android: target(android), ios: target(ios) }),
): void {
	app.post('/runtime-switch', async (context) => {
		try {
			const form = await parseAdminForm(context);
			const options = listReleaseOptions();
			const android = findRuntimeReleaseOption(
				options,
				'android',
				getFormString(form, 'androidResourceId'),
			);
			const ios = findRuntimeReleaseOption(
				options,
				'ios',
				getFormString(form, 'iosResourceId'),
			);
			if (android === undefined || ios === undefined)
				return context.text('resource version is not selectable', 400);
			await launchReleaseOptions(android, ios);
			return redirectAdmin(context);
		} catch (error) {
			return context.text(
				error instanceof Error ? error.message : String(error),
				400,
			);
		}
	});
}

function target(
	option: RuntimeReleaseOption,
): RuntimeResourceSelection['android'] {
	return {
		source: 'resource',
		clientVersion: option.clientVersion,
		resourceVersion: option.resourceVersion,
	};
}
