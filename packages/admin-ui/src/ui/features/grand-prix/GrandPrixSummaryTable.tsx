import type { GrandPrixSummary } from '@altair/runtime/admin/dto/admin-grand-prix-schema.ts';
import { Button, Chip } from '@mui/material';
import { useAdminUnsavedChangesContext } from '../../../hooks/useAdminUnsavedChanges.ts';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { SearchablePaginatedDataTable } from '../../components/SearchablePaginatedDataTable.tsx';
import type { GrandPrixRuntimeDraft } from './live-grand-prix-draft.ts';
import { selectGrandPrixDraft } from './live-grand-prix-draft.ts';
import { filterGrandPrixRows } from './live-grand-prix-form.ts';

type GrandPrixSummaryTableProps = {
	isSubmitting: boolean;
	grandPrixList: GrandPrixSummary[];
	activeGrandPrixId: number;
	runtime: GrandPrixRuntimeDraft;
	onSetActive: (runtime: GrandPrixRuntimeDraft) => Promise<void>;
};

export function GrandPrixSummaryTable({
	grandPrixList,
	isSubmitting,
	activeGrandPrixId,
	runtime,
	onSetActive,
}: GrandPrixSummaryTableProps): React.ReactElement {
	const { messages } = useAdminLanguage();
	const { requestAction } = useAdminUnsavedChangesContext();
	return (
		<SearchablePaginatedDataTable
			title={messages.pages['grand-prix']}
			searchLabel={messages.grandPrix.search}
			filterRows={filterGrandPrixRows}
			rows={grandPrixList}
			emptyText={messages.grandPrix.noEntries}
			getRowKey={(row) => String(row.grandPrixId)}
			columns={[
				{
					key: 'id',
					label: messages.grandPrix.id,
					render: (row) => row.grandPrixId,
				},
				{
					key: 'type',
					label: messages.type,
					render: (row) => row.grandPrixType,
				},
				{
					key: 'start',
					label: messages.startTime,
					render: (row) => row.startDate,
				},
				{ key: 'end', label: messages.endTime, render: (row) => row.endDate },
				{
					key: 'quests',
					label: messages.grandPrix.quests,
					render: (row) => row.questCount,
				},
				{
					key: 'stages',
					label: messages.grandPrix.stages,
					render: (row) => row.stageCount,
				},
				{
					key: 'rewards',
					label: messages.grandPrix.rewards,
					render: (row) => row.rewardCount,
				},
				{
					key: 'action',
					label: messages.action,
					render: (row) =>
						row.grandPrixId === activeGrandPrixId ? (
							<Chip size="small" color="primary" label={messages.active} />
						) : (
							<Button
								size="small"
								disabled={isSubmitting}
								variant="outlined"
								onClick={() =>
									requestAction(
										() => void onSetActive(selectGrandPrixDraft(runtime, row)),
									)
								}
							>
								{messages.grandPrix.setActive}
							</Button>
						),
				},
			]}
		/>
	);
}
