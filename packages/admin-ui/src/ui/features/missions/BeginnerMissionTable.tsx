import type { BeginnerMissionEntry } from '@altair/runtime/admin/dto/admin-seed-schema.ts';
import type { AdminUserBeginnerMission } from '@altair/runtime/admin/dto/admin-visible-state-schema.ts';
import { Box } from '@mui/material';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { SearchablePaginatedDataTable } from '../../components/SearchablePaginatedDataTable.tsx';
import { MissionEditButton } from './MissionEditButton.tsx';
import {
	createBeginnerMissionRows,
	filterBeginnerMissionRows,
} from './mission-progress-row-model.ts';

type BeginnerMissionTableProps = {
	catalog: BeginnerMissionEntry[];
	mission: AdminUserBeginnerMission | undefined;
	selectedMissionId: number;
	disabled: boolean;
	onSelect: (missionId: number) => void;
};

export function BeginnerMissionTable({
	catalog,
	mission,
	selectedMissionId,
	onSelect,
	disabled,
}: BeginnerMissionTableProps): React.ReactElement {
	const { messages } = useAdminLanguage();
	return (
		<Box sx={{ mt: 3 }}>
			<SearchablePaginatedDataTable
				title={messages.missions.beginner}
				rows={createBeginnerMissionRows(catalog, mission)}
				emptyText={messages.missions.noBeginner}
				getRowKey={(row) => String(row.missionId)}
				searchLabel={messages.missions.searchBeginner}
				filterRows={filterBeginnerMissionRows}
				columns={[
					{
						key: 'id',
						label: messages.missions.missionId,
						render: (row) => row.missionId,
					},
					{ key: 'name', label: messages.name, render: (row) => row.name },
					{
						key: 'target',
						label: messages.missions.targetCount,
						render: (row) => row.conditionAchieveNum,
					},
					{
						key: 'transition',
						label: messages.missions.transition,
						render: (row) => row.transitionContentsId,
					},
					{
						key: 'achieved',
						label: messages.missions.achievedCount,
						render: (row) => row.achievedNum,
					},
					{
						key: 'status',
						label: messages.status,
						render: (row) => row.status,
					},
					{
						key: 'action',
						label: messages.action,
						render: (row) => (
							<MissionEditButton
								disabled={disabled}
								selected={row.missionId === selectedMissionId}
								onClick={() => onSelect(row.missionId)}
							/>
						),
					},
				]}
			/>
		</Box>
	);
}
