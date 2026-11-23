import { Box, Switch } from '@mui/material';
import { useId } from 'react';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { NumericInput } from '../../components/NumericInput.tsx';
import { SaveButton } from '../../components/SaveButton.tsx';
import { SearchablePaginatedDataTable } from '../../components/SearchablePaginatedDataTable.tsx';
import type { DreamLiveProgressDraft } from './quest-drafts.ts';
import { filterQuestProgressRows } from './quest-drafts.ts';

export function DreamLivePanel({
	rows,
	isMutationDisabled,
	onChange,
	onSave,
}: {
	rows: DreamLiveProgressDraft[];
	isMutationDisabled: boolean;
	onChange: (
		row: DreamLiveProgressDraft,
		patch: Partial<DreamLiveProgressDraft>,
	) => void;
	onSave: (form: DreamLiveProgressDraft) => Promise<void>;
}): React.ReactElement {
	const { messages } = useAdminLanguage();
	const formPrefix = useId();
	return (
		<SearchablePaginatedDataTable<DreamLiveProgressDraft>
			title={messages.quest.dream}
			searchLabel={messages.quest.searchProgress}
			filterRows={filterQuestProgressRows}
			rows={rows}
			emptyText={messages.quest.noDreamProgress}
			getRowKey={(row) => String(row.stageId)}
			columns={[
				{
					key: 'stage',
					label: messages.quest.stage,
					render: (row) => row.stageId,
				},
				{
					key: 'clear_times',
					label: messages.quest.clearTimes,
					render: (row) => (
						<NumericInput
							label={messages.quest.clearTimes}
							value={row.clearTimes}
							form={`${formPrefix}-${row.stageId}`}
							disabled={isMutationDisabled}
							step={1}
							max={999999}
							min={0}
							onValueChange={(clearTimes) => onChange(row, { clearTimes })}
						/>
					),
				},
				{
					key: 'card',
					label: messages.quest.card,
					render: (row) => (
						<Switch
							slotProps={{ input: { 'aria-label': messages.quest.card } }}
							disabled={isMutationDisabled}
							checked={row.isGetCard}
							onChange={(event) =>
								onChange(row, { isGetCard: event.target.checked })
							}
						/>
					),
				},
				{
					key: 'limit_break',
					label: messages.inventory.limitBreak,
					render: (row) => (
						<NumericInput
							label={messages.inventory.limitBreak}
							value={row.limitBreakTimes}
							form={`${formPrefix}-${row.stageId}`}
							disabled={isMutationDisabled}
							step={1}
							max={999}
							min={0}
							onValueChange={(limitBreakTimes) =>
								onChange(row, { limitBreakTimes })
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
							id={`${formPrefix}-${row.stageId}`}
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
