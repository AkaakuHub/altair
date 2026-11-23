import type { AdminChapterMissionProgress } from '@altair/runtime/admin/dto/admin-visible-state-schema.ts';
import { Box } from '@mui/material';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { SearchablePaginatedDataTable } from '../../components/SearchablePaginatedDataTable.tsx';
import { MissionEditButton } from './MissionEditButton.tsx';
import { filterChapterMissionRows } from './mission-progress-row-model.ts';

type ChapterMissionTableProps = {
	rows: AdminChapterMissionProgress[];
	selectedMissionId: number;
	disabled: boolean;
	onSelect: (mission: AdminChapterMissionProgress) => void;
};

export function ChapterMissionTable({
	rows,
	selectedMissionId,
	onSelect,
	disabled,
}: ChapterMissionTableProps): React.ReactElement {
	const { messages } = useAdminLanguage();
	return (
		<Box sx={{ mt: 3 }}>
			<SearchablePaginatedDataTable
				title={messages.missions.chapter}
				rows={rows}
				emptyText={messages.missions.noChapterProgress}
				getRowKey={(row) => String(row.missionId)}
				searchLabel={messages.missions.searchChapter}
				filterRows={filterChapterMissionRows}
				columns={[
					{
						key: 'mission',
						label: messages.missions.mission,
						render: (row) => row.missionId,
					},
					{
						key: 'achieved',
						label: messages.missions.achievedCount,
						render: (row) => row.achievedNum,
					},
					{
						key: 'achieved_status',
						label: messages.missions.completed,
						render: (row) => (row.isAchieved ? messages.yes : messages.no),
					},
					{
						key: 'received',
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
								onClick={() => onSelect(row)}
							/>
						),
					},
				]}
			/>
		</Box>
	);
}
