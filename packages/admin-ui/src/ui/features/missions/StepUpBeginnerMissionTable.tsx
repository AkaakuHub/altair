import type { AdminUserStepUpBeginnerMission } from '@altair/runtime/admin/dto/admin-visible-state-schema.ts';
import { Box } from '@mui/material';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { SearchablePaginatedDataTable } from '../../components/SearchablePaginatedDataTable.tsx';
import { MissionEditButton } from './MissionEditButton.tsx';
import {
	createStepUpBeginnerMissionRows,
	filterStepUpBeginnerMissionRows,
} from './mission-progress-row-model.ts';

type StepUpBeginnerMissionTableProps = {
	catalog: Array<{ missionId: number }>;
	mission: AdminUserStepUpBeginnerMission | undefined;
	selectedMissionId: number;
	disabled: boolean;
	onSelect: (missionId: number) => void;
};

export function StepUpBeginnerMissionTable({
	catalog,
	mission,
	selectedMissionId,
	onSelect,
	disabled,
}: StepUpBeginnerMissionTableProps): React.ReactElement {
	const { messages } = useAdminLanguage();
	return (
		<Box sx={{ mt: 3 }}>
			<SearchablePaginatedDataTable
				title={messages.missions.stepUpBeginner}
				rows={createStepUpBeginnerMissionRows(catalog, mission)}
				emptyText={messages.missions.noStepUpBeginner}
				getRowKey={(row) => String(row.missionId)}
				searchLabel={messages.missions.searchStepUpBeginner}
				filterRows={filterStepUpBeginnerMissionRows}
				columns={[
					{
						key: 'id',
						label: messages.missions.missionId,
						render: (row) => row.missionId,
					},
					{
						key: 'achieved_num',
						label: messages.missions.achievedCount,
						render: (row) => row.achievedNum,
					},
					{
						key: 'is_achieved',
						label: messages.missions.completed,
						render: (row) => (row.isAchieved ? messages.yes : messages.no),
					},
					{
						key: 'is_received',
						label: messages.received,
						render: (row) => (row.isReceived ? messages.yes : messages.no),
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
