import type {
	ActivityRecordAdvSummary,
	ActivityRecordSeriesSummary,
} from '@altair/runtime/admin/dto/admin-seed-schema.ts';
import type { AdminUserActivityRecord } from '@altair/runtime/admin/dto/admin-visible-state-schema.ts';

export type MonthForm = { advSeriesId: number; isDisplayed: boolean };
export type AdvForm = {
	advSeriesId: number;
	advDataId: number;
	isWatched: boolean;
};

export function createMonthForm(
	activityRecord: AdminUserActivityRecord | undefined,
	advSeriesId: number,
): MonthForm {
	return {
		advSeriesId,
		isDisplayed:
			activityRecord?.displayedActivityRecordAdvSeriesIds.includes(
				advSeriesId,
			) ?? false,
	};
}
export function createAdvForm(
	seriesList: readonly ActivityRecordSeriesSummary[],
	activityRecord: AdminUserActivityRecord | undefined,
	advSeriesId: number,
	advDataId: number,
): AdvForm {
	const validAdvDataId =
		findAdvById(seriesList, advSeriesId, advDataId)?.advDataId ?? 0;
	return {
		advSeriesId,
		advDataId: validAdvDataId,
		isWatched:
			activityRecord?.watchedActivityRecordAdvDataIds.includes(
				validAdvDataId,
			) ?? false,
	};
}
export function findFirstAdvId(
	seriesList: readonly ActivityRecordSeriesSummary[],
	advSeriesId: number,
): number {
	return (
		seriesList.find((series) => series.advSeriesId === advSeriesId)?.advList[0]
			?.advDataId ?? 0
	);
}
function findAdvById(
	seriesList: readonly ActivityRecordSeriesSummary[],
	advSeriesId: number,
	advDataId: number,
): ActivityRecordAdvSummary | undefined {
	return seriesList
		.find((series) => series.advSeriesId === advSeriesId)
		?.advList.find((adv) => adv.advDataId === advDataId);
}
export function filterActivityRecordSeries(
	seriesList: ActivityRecordSeriesSummary[],
	query: string,
): ActivityRecordSeriesSummary[] {
	const normalized = query.trim().toLowerCase();
	if (normalized.length === 0) return seriesList;
	return seriesList.filter((series) =>
		`${series.advSeriesId} ${series.name} ${series.advList.map((adv) => adv.advDataId).join(' ')}`
			.toLowerCase()
			.includes(normalized),
	);
}
