import { Box } from '@mui/material';
import { useId } from 'react';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { NumericInput } from '../../components/NumericInput.tsx';
import { SaveButton } from '../../components/SaveButton.tsx';
import { SearchablePaginatedDataTable } from '../../components/SearchablePaginatedDataTable.tsx';
import type { GrandPrixProgressDraft } from './quest-drafts.ts';
import { filterQuestProgressRows } from './quest-drafts.ts';

export function GrandPrixPanel({
	rows,
	isMutationDisabled,
	onChange,
	onSave,
}: {
	rows: GrandPrixProgressDraft[];
	isMutationDisabled: boolean;
	onChange: (
		row: GrandPrixProgressDraft,
		patch: Partial<GrandPrixProgressDraft>,
	) => void;
	onSave: (form: GrandPrixProgressDraft) => Promise<void>;
}): React.ReactElement {
	const { messages } = useAdminLanguage();
	const formPrefix = useId();
	return (
		<SearchablePaginatedDataTable<GrandPrixProgressDraft>
			title={messages.pages['grand-prix']}
			searchLabel={messages.quest.searchProgress}
			filterRows={filterQuestProgressRows}
			rows={rows}
			emptyText={messages.quest.noGrandPrixProgress}
			getRowKey={(row) => `${row.grandPrixId}-${row.stageId}`}
			columns={[
				{
					key: 'gp',
					label: messages.pages['grand-prix'],
					render: (row) => row.grandPrixId,
				},
				{
					key: 'stage',
					label: messages.quest.stage,
					render: (row) => row.stageId,
				},
				{
					key: 'high',
					label: messages.quest.highScore,
					render: (row) => (
						<NumericInput
							label={messages.quest.highScore}
							value={row.highScore}
							form={`${formPrefix}-${row.grandPrixId}-${row.stageId}`}
							disabled={isMutationDisabled}
							step={1}
							max={999999999}
							min={0}
							onValueChange={(highScore) => onChange(row, { highScore })}
						/>
					),
				},
				{
					key: 'daily',
					label: messages.quest.dailyBest,
					render: (row) => (
						<NumericInput
							label={messages.quest.dailyBest}
							value={row.dailyBestScore}
							form={`${formPrefix}-${row.grandPrixId}-${row.stageId}`}
							disabled={isMutationDisabled}
							step={1}
							max={999999999}
							min={0}
							onValueChange={(dailyBestScore) =>
								onChange(row, { dailyBestScore })
							}
						/>
					),
				},
				{
					key: 'count',
					label: messages.quest.playCount,
					render: (row) => (
						<NumericInput
							label={messages.quest.playCount}
							value={row.playCount}
							form={`${formPrefix}-${row.grandPrixId}-${row.stageId}`}
							disabled={isMutationDisabled}
							step={1}
							max={999999}
							min={0}
							onValueChange={(playCount) => onChange(row, { playCount })}
						/>
					),
				},
				{
					key: 'action',
					label: messages.action,
					render: (row) => (
						<Box
							component="form"
							id={`${formPrefix}-${row.grandPrixId}-${row.stageId}`}
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
	);
}
