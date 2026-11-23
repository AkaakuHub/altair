import type { Database } from 'bun:sqlite';
import { getGachaGuaranteeExchangeItemsBySeriesIdFromDatabase } from '../../../../src/master-data/gacha-guarantee-master.ts';
import type { ServerState } from '../../../../src/server-state-schema.ts';
import { updateGachaGuaranteeFromForm } from '../forms/gacha/admin-user-gacha-form.ts';
import {
	type AdminForm,
	getAdminPositiveId,
} from '../forms/shared/admin-form-values.ts';

export function updateGachaGuaranteeRoute(
	form: AdminForm,
	state: ServerState,
	database: Database,
): boolean {
	const gachaSeriesId = getAdminPositiveId(form, 'gachaSeriesId');
	if (gachaSeriesId === undefined) {
		return false;
	}
	return updateGachaGuaranteeFromForm(
		form,
		state,
		getGachaGuaranteeExchangeItemsBySeriesIdFromDatabase(
			database,
			gachaSeriesId,
		),
	);
}
