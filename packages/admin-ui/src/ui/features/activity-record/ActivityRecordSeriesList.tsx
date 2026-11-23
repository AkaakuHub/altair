import type { ActivityRecordSeriesSummary } from '@altair/runtime/admin/dto/admin-seed-schema.ts';
import type { AdminUserActivityRecord } from '@altair/runtime/admin/dto/admin-visible-state-schema.ts';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { SearchablePaginatedDataTable } from '../../components/SearchablePaginatedDataTable.tsx';
import { filterActivityRecordSeries } from './activity-record-model.ts';

export function ActivityRecordSeriesList({
	rows,
	activityRecord,
}: {
	rows: ActivityRecordSeriesSummary[];
	activityRecord: AdminUserActivityRecord | undefined;
}): React.ReactElement {
	const { messages } = useAdminLanguage();
	return (
		<SearchablePaginatedDataTable<ActivityRecordSeriesSummary>
			title={messages.activityRecord.activityRecordSeries}
			rows={rows}
			emptyText={messages.activityRecord.noActivityRecords}
			getRowKey={(row) => String(row.advSeriesId)}
			searchLabel={messages.activityRecord.searchActivityRecords}
			filterRows={filterActivityRecordSeries}
			columns={[
				{
					key: 'series',
					label: messages.activityRecord.series,
					render: (row) => row.advSeriesId,
				},
				{ key: 'name', label: messages.name, render: (row) => row.name },
				{
					key: 'displayed',
					label: messages.activityRecord.displayed,
					render: (row) =>
						(activityRecord?.displayedActivityRecordAdvSeriesIds.includes(
							row.advSeriesId,
						) ?? false)
							? messages.yes
							: messages.no,
				},
				{
					key: 'watched',
					label: messages.activityRecord.watchedAdv,
					render: (row) =>
						row.advList.filter((adv) =>
							activityRecord?.watchedActivityRecordAdvDataIds.includes(
								adv.advDataId,
							),
						).length,
				},
				{
					key: 'advCount',
					label: messages.activityRecord.advCount,
					render: (row) => row.advList.length,
				},
			]}
		/>
	);
}
