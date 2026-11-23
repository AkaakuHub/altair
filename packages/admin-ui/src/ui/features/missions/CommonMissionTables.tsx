import type { MissionCatalogEntry } from '@altair/runtime/admin/dto/admin-seed-schema.ts';
import type { AdminUserMission } from '@altair/runtime/admin/dto/admin-visible-state-schema.ts';
import { Box } from '@mui/material';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { SearchablePaginatedDataTable } from '../../components/SearchablePaginatedDataTable.tsx';
import { MissionEditButton } from './MissionEditButton.tsx';
import {
	type CommonMissionRow,
	createCommonMissionRows,
	filterCommonMissionRows,
} from './mission-progress-row-model.ts';

type CommonMissionTablesProps = {
	catalog: MissionCatalogEntry[];
	dailyCatalog: MissionCatalogEntry[];
	mission: AdminUserMission | undefined;
	selectedMissionId: number;
	disabled: boolean;
	onSelect: (missionId: number) => void;
};

export function CommonMissionTables({
	catalog,
	dailyCatalog,
	mission,
	selectedMissionId,
	onSelect,
	disabled,
}: CommonMissionTablesProps): React.ReactElement {
	const { messages } = useAdminLanguage();
	const columns = (allowDerived: boolean) => [
		{
			key: 'id',
			label: messages.missions.missionId,
			render: (row: CommonMissionRow) => row.missionId,
		},
		{
			key: 'name',
			label: messages.name,
			render: (row: CommonMissionRow) => row.name,
		},
		{
			key: 'target',
			label: messages.missions.targetCount,
			render: (row: CommonMissionRow) => row.conditionAchieveNum,
		},
		{
			key: 'achieved',
			label: messages.missions.achievedCount,
			render: (row: CommonMissionRow) => row.achievedNum,
		},
		{
			key: 'done',
			label: messages.missions.completed,
			render: (row: CommonMissionRow) =>
				row.isAchieved ? messages.yes : messages.no,
		},
		{
			key: 'action',
			label: messages.action,
			render: (row: CommonMissionRow) => (
				<MissionEditButton
					selected={row.missionId === selectedMissionId}
					disabled={disabled || (!allowDerived && row.isDerived)}
					onClick={() => onSelect(row.missionId)}
				/>
			),
		},
	];
	return (
		<>
			<Box sx={{ mb: 3 }}>
				<SearchablePaginatedDataTable
					title={messages.missions.dailyWithCount(dailyCatalog.length)}
					rows={createCommonMissionRows(dailyCatalog, catalog, mission)}
					emptyText={messages.missions.noDaily}
					getRowKey={missionKey}
					searchLabel={messages.missions.searchDaily}
					filterRows={filterCommonMissionRows}
					columns={columns(true)}
				/>
			</Box>
			<SearchablePaginatedDataTable
				title={messages.missions.common}
				rows={createCommonMissionRows(catalog, catalog, mission)}
				emptyText={messages.missions.noMissions}
				getRowKey={missionKey}
				searchLabel={messages.missions.searchCommon}
				filterRows={filterCommonMissionRows}
				columns={columns(false)}
			/>
		</>
	);
}

function missionKey(row: CommonMissionRow): string {
	return String(row.missionId);
}
