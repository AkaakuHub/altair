import { Box, Switch } from '@mui/material';
import { useId } from 'react';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { NumericInput } from '../../components/NumericInput.tsx';
import { SaveButton } from '../../components/SaveButton.tsx';
import { SearchablePaginatedDataTable } from '../../components/SearchablePaginatedDataTable.tsx';
import type { LearningProgressDraft } from './quest-drafts.ts';
import { filterQuestProgressRows } from './quest-drafts.ts';

export function LearningLivePanel({
	rows,
	isMutationDisabled,
	onChange,
	onSave,
}: {
	rows: LearningProgressDraft[];
	isMutationDisabled: boolean;
	onChange: (
		row: LearningProgressDraft,
		patch: Partial<LearningProgressDraft>,
	) => void;
	onSave: (form: LearningProgressDraft) => Promise<void>;
}): React.ReactElement {
	const { messages } = useAdminLanguage();
	const formPrefix = useId();
	return (
		<SearchablePaginatedDataTable<LearningProgressDraft>
			title={messages.quest.learning}
			searchLabel={messages.quest.searchProgress}
			filterRows={filterQuestProgressRows}
			rows={rows}
			emptyText={messages.quest.noLearningMastery}
			getRowKey={(row) => String(row.musicId)}
			columns={[
				{
					key: 'music',
					label: messages.quest.music,
					render: (row) => row.musicId,
				},
				{
					key: 'level',
					label: messages.level,
					render: (row) => (
						<NumericInput
							label={messages.level}
							value={row.musicExpLevel}
							form={`${formPrefix}-${row.musicId}`}
							disabled={isMutationDisabled}
							step={1}
							max={50}
							min={0}
							onValueChange={(musicExpLevel) =>
								onChange(row, { musicExpLevel })
							}
						/>
					),
				},
				{
					key: 'exp',
					label: messages.quest.earnedExp,
					render: (row) => (
						<NumericInput
							label={messages.quest.earnedExp}
							value={row.earnedMusicExp}
							form={`${formPrefix}-${row.musicId}`}
							disabled={isMutationDisabled}
							step={1}
							max={999999999}
							min={0}
							onValueChange={(earnedMusicExp) =>
								onChange(row, { earnedMusicExp })
							}
						/>
					),
				},
				{
					key: 'mastery',
					label: messages.quest.mastery,
					render: (row) => (
						<Switch
							slotProps={{ input: { 'aria-label': messages.quest.mastery } }}
							disabled={isMutationDisabled}
							checked={row.isMastery}
							onChange={(event) =>
								onChange(row, { isMastery: event.target.checked })
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
							id={`${formPrefix}-${row.musicId}`}
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
