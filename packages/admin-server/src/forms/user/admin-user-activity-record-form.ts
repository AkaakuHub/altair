import type { ActiveMasterRouteSelection as MasterDatabaseSelection } from '../../../../../src/master-data/active-master-repository.ts';
import {
	getActivityRecordAdminSummaryFromDatabase,
	getActivityRecordAdvProvenanceFromDatabase,
	getActivityRecordSeriesProvenanceFromDatabase,
} from '../../../../../src/master-data/activity-record-master.ts';
import type { ServerState } from '../../../../../src/server-state-schema.ts';
import { ensureUserActivityRecordState } from '../../../../../src/state/activity-record-aggregate.ts';
import {
	setActivityRecordAdvWatched,
	setActivityRecordMonthDisplayed,
} from '../../../../../src/state/activity-record-mutation.ts';
import {
	type AdminForm,
	getAdminPositiveId,
	getFormBoolean,
	getFormString,
} from '../shared/admin-form-values.ts';

export function updateActivityRecordAdvFromForm(
	form: AdminForm,
	state: ServerState,
	selection: MasterDatabaseSelection,
): boolean {
	const playerId = getFormString(form, 'playerId');
	const advDataId = getAdminPositiveId(form, 'advDataId');
	if (
		playerId.length === 0 ||
		advDataId === undefined ||
		!hasActivityRecordAdvDataId(selection.database, advDataId)
	)
		return false;
	const provenance = getActivityRecordAdvProvenanceFromDatabase(
		selection.database,
		selection.masterReleaseId,
		advDataId,
	);
	if (provenance === undefined) return false;
	return setActivityRecordAdvWatched(
		ensureUserActivityRecordState(state, playerId).value,
		advDataId,
		getFormBoolean(form, 'isWatched'),
		provenance,
	);
}

export function updateActivityRecordMonthFromForm(
	form: AdminForm,
	state: ServerState,
	selection: MasterDatabaseSelection,
): boolean {
	const playerId = getFormString(form, 'playerId');
	const advSeriesId = getAdminPositiveId(form, 'advSeriesId');
	if (
		playerId.length === 0 ||
		advSeriesId === undefined ||
		!hasActivityRecordAdvSeriesId(selection.database, advSeriesId)
	)
		return false;
	const provenance = getActivityRecordSeriesProvenanceFromDatabase(
		selection.database,
		selection.masterReleaseId,
		advSeriesId,
	);
	if (provenance === undefined) return false;
	return setActivityRecordMonthDisplayed(
		ensureUserActivityRecordState(state, playerId).value,
		advSeriesId,
		getFormBoolean(form, 'isDisplayed'),
		provenance,
	);
}

function hasActivityRecordAdvSeriesId(
	database: MasterDatabaseSelection['database'],
	advSeriesId: number,
): boolean {
	return getActivityRecordAdminSummaryFromDatabase(database).some(
		(series) => series.advSeriesId === advSeriesId,
	);
}

function hasActivityRecordAdvDataId(
	database: MasterDatabaseSelection['database'],
	advDataId: number,
): boolean {
	return getActivityRecordAdminSummaryFromDatabase(database).some((series) =>
		series.advList.some((adv) => adv.advDataId === advDataId),
	);
}
