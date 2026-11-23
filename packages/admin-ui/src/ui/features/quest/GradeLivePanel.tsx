import type { AdminUserLive } from '@altair/runtime/admin/dto/admin-visible-state-schema.ts';
import { Box, Stack, Switch } from '@mui/material';
import { useId } from 'react';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { DataTable } from '../../components/DataTable.tsx';
import { NumericInput } from '../../components/NumericInput.tsx';
import { SaveButton } from '../../components/SaveButton.tsx';
import { SearchablePaginatedDataTable } from '../../components/SearchablePaginatedDataTable.tsx';
import type { GradeProgressDraft } from './quest-drafts.ts';
import { filterQuestProgressRows } from './quest-drafts.ts';

export function GradeLivePanel({
	rows,
	currentGradeQuest,
	isMutationDisabled,
	onChange,
	onSave,
}: {
	rows: GradeProgressDraft[];
	currentGradeQuest: AdminUserLive['currentGradeQuest'];
	isMutationDisabled: boolean;
	onChange: (
		row: GradeProgressDraft,
		patch: Partial<GradeProgressDraft>,
	) => void;
	onSave: (form: GradeProgressDraft) => Promise<void>;
}): React.ReactElement {
	const { messages } = useAdminLanguage();
	const formPrefix = useId();
	return (
		<Stack spacing={2}>
			<SearchablePaginatedDataTable<GradeProgressDraft>
				title={messages.pages['grade-live']}
				searchLabel={messages.quest.searchProgress}
				filterRows={filterQuestProgressRows}
				rows={rows}
				emptyText={messages.quest.noGradeProgress}
				getRowKey={(row) => String(row.seriesId)}
				columns={[
					{
						key: 'series',
						label: messages.quest.series,
						render: (row) => row.seriesId,
					},
					{
						key: 'status',
						label: messages.quest.clearStatus,
						render: (row) => (
							<NumericInput
								label={messages.quest.clearStatus}
								value={row.clearStatus}
								form={`${formPrefix}-${row.seriesId}`}
								disabled={isMutationDisabled}
								step={1}
								max={3}
								min={0}
								onValueChange={(clearStatus) => onChange(row, { clearStatus })}
							/>
						),
					},
					{
						key: 'bonus',
						label: messages.quest.bonus,
						render: (row) => (
							<Switch
								slotProps={{ input: { 'aria-label': messages.quest.bonus } }}
								disabled={isMutationDisabled}
								checked={row.bonusCleared}
								onChange={(event) =>
									onChange(row, { bonusCleared: event.target.checked })
								}
							/>
						),
					},
					{
						key: 'action',
						label: messages.action,
						render: (row) => (
							<Box
								component="form"
								id={`${formPrefix}-${row.seriesId}`}
								onSubmit={(event) => {
									event.preventDefault();
									void onSave(row);
								}}
							>
								<SaveButton
									type="submit"
									size="small"
									disabled={isMutationDisabled}
								/>
							</Box>
						),
					},
				]}
			/>
			{currentGradeQuest ? (
				<DataTable<(typeof currentGradeQuest.squares)[number]>
					rows={currentGradeQuest.squares}
					emptyText={messages.quest.noCurrentGradeSquares}
					getRowKey={(row) => String(row.squareId)}
					columns={[
						{
							key: 'square',
							label: messages.quest.square,
							render: (row) => row.squareId,
						},
						{
							key: 'status',
							label: messages.status,
							render: (row) => row.status,
						},
						{
							key: 'live_point',
							label: messages.quest.livePoint,
							render: (row) => row.livePoint,
						},
					]}
				/>
			) : null}
		</Stack>
	);
}
