import {
	type AdminForm,
	getFormString,
} from '@altair/admin-server/forms/shared/admin-form-values.ts';
import type { ActiveMasterSelection } from '../../../../../src/master-data/active-master-repository.ts';
import {
	isResourceVersionOption,
	type ResourceVersionRegistry,
} from '../../../../../src/resource-versions.ts';
import type { ServerState } from '../../../../../src/server-state-schema.ts';

export function updateResourceVersionOverridesFromForm(
	form: AdminForm,
	state: ServerState,
	resourceVersions: ResourceVersionRegistry,
	activeMaster: ActiveMasterSelection,
): boolean {
	const androidResourceVersion = getFormString(form, 'androidResourceVersion');
	const iosResourceVersion = getFormString(form, 'iosResourceVersion');
	if (
		!isResourceVersionOption(
			resourceVersions,
			'android',
			androidResourceVersion,
		) ||
		!isResourceVersionOption(resourceVersions, 'ios', iosResourceVersion) ||
		androidResourceVersion !== activeMaster.androidResourceVersion ||
		iosResourceVersion !== activeMaster.iosResourceVersion
	) {
		return false;
	}
	state.resourceVersionOverrides = {
		android: androidResourceVersion,
		ios: iosResourceVersion,
	};
	return true;
}
