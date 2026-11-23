import type { Database } from 'bun:sqlite';
import type {
	EntityIdentityFingerprint,
	EntityProvenance,
} from '../state/entity-provenance.ts';
import {
	createActivityRecordAdvIdentityFingerprint,
	createActivityRecordSeriesIdentityFingerprint,
} from './activity-record-identity.ts';
import {
	getActivityRecordAdvRows,
	getActivityRecordSeriesRows,
	getLatestActivityRecordSeriesRow,
} from './activity-record-master-queries.ts';
import {
	type ActivityRecordMonthlyInfo,
	type ActivityRecordWatchReward,
	createActivityRecordMonthlyInfoList,
	createActivityRecordWatchRewardList,
} from './activity-record-master-view.ts';
import { currentUtcIsoDateTime } from './master-time.ts';

export type { ActivityRecordMonthlyInfo, ActivityRecordWatchReward };

export type ActivityRecordSeriesAdminSummaryMaster = {
	advSeriesId: number;
	name: string;
	advList: ActivityRecordAdvAdminSummaryMaster[];
};

export type ActivityRecordAdvAdminSummaryMaster = {
	advDataId: number;
	title: string;
	orderId: number;
};

type ActivityRecordMasterIdentityCatalog = Readonly<{
	advFingerprints: ReadonlyMap<number, EntityIdentityFingerprint>;
	seriesFingerprints: ReadonlyMap<number, EntityIdentityFingerprint>;
}>;

export function getActivityRecordMasterIdentityCatalogFromDatabase(
	database: Database,
): ActivityRecordMasterIdentityCatalog {
	const now = currentUtcIsoDateTime();
	const seriesRows = getActivityRecordSeriesRows(database, now);
	const advRows = getActivityRecordAdvRows(database, now);
	return {
		advFingerprints: new Map(
			advRows.map((adv) => [
				adv.id,
				createActivityRecordAdvIdentityFingerprint(adv),
			]),
		),
		seriesFingerprints: new Map(
			seriesRows.map((series) => [
				series.id,
				createActivityRecordSeriesIdentityFingerprint(series, advRows),
			]),
		),
	};
}

export function getActivityRecordAdvProvenanceFromDatabase(
	database: Database,
	masterReleaseId: string,
	advDataId: number,
): EntityProvenance | undefined {
	const identityFingerprint =
		getActivityRecordMasterIdentityCatalogFromDatabase(
			database,
		).advFingerprints.get(advDataId);
	return identityFingerprint === undefined
		? undefined
		: { sourceMasterReleaseId: masterReleaseId, identityFingerprint };
}

export function getActivityRecordSeriesProvenanceFromDatabase(
	database: Database,
	masterReleaseId: string,
	advSeriesId: number,
): EntityProvenance | undefined {
	const identityFingerprint =
		getActivityRecordMasterIdentityCatalogFromDatabase(
			database,
		).seriesFingerprints.get(advSeriesId);
	return identityFingerprint === undefined
		? undefined
		: { sourceMasterReleaseId: masterReleaseId, identityFingerprint };
}

type ActivityRecordAdvUnlockMaster = {
	advDataId: number;
	advUnlockItemId: number;
	advUnlockItemNum: number;
	advUnlockConditionValue: number;
};

type ActivityRecordAdvWatchRewardMaster = {
	advDataId: number;
	advSeriesId: number;
	watchRewardList: ActivityRecordWatchReward[];
};

export function getActivityRecordMonthlyInfoListFromDatabase(
	database: Database,
	watchedAdvDataIds: ReadonlySet<number>,
	displayedAdvSeriesIds: ReadonlySet<number>,
	unlockedAdvDataIds: ReadonlySet<number>,
	unlockItemNumByItemId: ReadonlyMap<number, number>,
): ActivityRecordMonthlyInfo[] {
	const now = currentUtcIsoDateTime();
	const currentSeriesId =
		getLatestActivityRecordSeriesRow(database, now)?.id ?? null;
	return createActivityRecordMonthlyInfoList(
		getActivityRecordSeriesRows(database, now),
		getActivityRecordAdvRows(database, now),
		currentSeriesId,
		watchedAdvDataIds,
		displayedAdvSeriesIds,
		unlockedAdvDataIds,
		unlockItemNumByItemId,
	);
}

export function getActivityRecordAdvUnlockMasterFromDatabase(
	database: Database,
	advDataId: number,
): ActivityRecordAdvUnlockMaster | undefined {
	const adv = getActivityRecordAdvRows(database, currentUtcIsoDateTime()).find(
		(row) => row.id === advDataId,
	);
	if (!adv) {
		return undefined;
	}
	return {
		advDataId: adv.id,
		advUnlockItemId: adv.adv_unlock_item_id,
		advUnlockItemNum: adv.adv_unlock_item_num,
		advUnlockConditionValue: adv.adv_unlock_condition_value,
	};
}

export function getActivityRecordAdvWatchRewardMasterFromDatabase(
	database: Database,
	advDataId: number,
): ActivityRecordAdvWatchRewardMaster | undefined {
	const adv = getActivityRecordAdvRows(database, currentUtcIsoDateTime()).find(
		(row) => row.id === advDataId,
	);
	if (!adv) {
		return undefined;
	}
	return {
		advDataId: adv.id,
		advSeriesId: adv.adv_series_id,
		watchRewardList: createActivityRecordWatchRewardList(adv),
	};
}

export function isLatestActivityRecordSeriesInDatabase(
	database: Database,
	advSeriesId: number,
): boolean {
	return (
		getLatestActivityRecordSeriesRow(database, currentUtcIsoDateTime())?.id ===
		advSeriesId
	);
}

export function getActivityRecordAdminSummaryFromDatabase(
	database: Database,
): ActivityRecordSeriesAdminSummaryMaster[] {
	const now = currentUtcIsoDateTime();
	const advDataRows = getActivityRecordAdvRows(database, now);
	return getActivityRecordSeriesRows(database, now).map((series) => ({
		advSeriesId: series.id,
		name: series.name,
		advList: advDataRows
			.filter((adv) => adv.adv_series_id === series.id)
			.map((adv) => ({
				advDataId: adv.id,
				title: adv.name,
				orderId: adv.order_id,
			})),
	}));
}
