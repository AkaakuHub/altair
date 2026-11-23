import type { GrandPrixSummary } from '@altair/runtime/admin/dto/admin-grand-prix-schema.ts';
import type { AdminStateResponse } from '@altair/runtime/admin/dto/admin-state-response-schema.ts';
import { Box, Grid, MenuItem, TextField } from '@mui/material';
import type { RefObject } from 'react';
import { useAdminUnsavedChangesContext } from '../../../hooks/useAdminUnsavedChanges.ts';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { AdminSectionCard } from '../../components/AdminSectionCard.tsx';
import { DateTimeInput } from '../../components/DateTimeInput.tsx';
import { NumericInput } from '../../components/NumericInput.tsx';
import { SaveButton } from '../../components/SaveButton.tsx';
import { GrandPrixStageEditor } from './GrandPrixStageEditor.tsx';
import type { GrandPrixRuntimeDraft } from './live-grand-prix-draft.ts';
import { selectGrandPrixDraft } from './live-grand-prix-draft.ts';

type GrandPrixRuntimeEditorFormProps = {
	formRef: RefObject<HTMLFormElement | null>;
	grandPrixList: GrandPrixSummary[];
	grandPrixDetail: AdminStateResponse['grandPrixDetail'];
	runtime: GrandPrixRuntimeDraft;
	isSubmitting: boolean;
	onRuntimeChange: (runtime: GrandPrixRuntimeDraft) => void;
	onSave: (runtime: GrandPrixRuntimeDraft) => Promise<void>;
};

export function GrandPrixRuntimeEditorForm({
	grandPrixList,
	formRef,
	grandPrixDetail,
	runtime,
	isSubmitting,
	onRuntimeChange,
	onSave,
}: GrandPrixRuntimeEditorFormProps): React.ReactElement {
	const { messages } = useAdminLanguage();
	const { requestAction } = useAdminUnsavedChangesContext();
	return (
		<AdminSectionCard title={messages.pages['grand-prix']}>
			<Box
				component="form"
				ref={formRef}
				onSubmit={(event) => {
					event.preventDefault();
					void onSave(runtime);
				}}
			>
				<Grid container spacing={2}>
					<Grid size={{ xs: 12, md: 6 }}>
						<TextField
							select
							fullWidth
							size="small"
							label={messages.grandPrix.activeId}
							value={runtime.activeGrandPrixId}
							disabled={isSubmitting}
							onChange={(event) => {
								const selectedGrandPrix = grandPrixList.find(
									(grandPrix) =>
										grandPrix.grandPrixId === Number(event.target.value),
								);
								if (selectedGrandPrix !== undefined) {
									requestAction(() =>
										onRuntimeChange(
											selectGrandPrixDraft(runtime, selectedGrandPrix),
										),
									);
								}
							}}
						>
							{grandPrixList.map((grandPrix) => (
								<MenuItem
									key={grandPrix.grandPrixId}
									value={grandPrix.grandPrixId}
								>
									{grandPrix.grandPrixId} {messages.type}:
									{grandPrix.grandPrixType} {grandPrix.startDate} -{' '}
									{grandPrix.endDate}
								</MenuItem>
							))}
						</TextField>
					</Grid>
					<Grid size={{ xs: 12, md: 3 }}>
						<NumericInput
							label={messages.type}
							step={1}
							max={Number.MAX_SAFE_INTEGER}
							value={runtime.grandPrixType}
							disabled={isSubmitting}
							onValueChange={(grandPrixType) =>
								onRuntimeChange({ ...runtime, grandPrixType })
							}
						/>
					</Grid>
					<Grid size={{ xs: 12, md: 3 }}>
						<TextField
							select
							fullWidth
							size="small"
							label={messages.status}
							value={runtime.status}
							disabled={isSubmitting}
							onChange={(event) =>
								onRuntimeChange({
									...runtime,
									status: Number(event.target.value),
								})
							}
						>
							<MenuItem value={2}>{messages.grandPrix.open}</MenuItem>
							<MenuItem value={1}>{messages.grandPrix.results}</MenuItem>
							<MenuItem value={0}>{messages.grandPrix.closed}</MenuItem>
						</TextField>
					</Grid>
					<Grid size={{ xs: 12, md: 3 }}>
						<NumericInput
							label={messages.grandPrix.dailyPlayableCount}
							step={1}
							max={Number.MAX_SAFE_INTEGER}
							value={runtime.dailyPlayableCount}
							disabled={isSubmitting}
							min={0}
							onValueChange={(dailyPlayableCount) =>
								onRuntimeChange({ ...runtime, dailyPlayableCount })
							}
						/>
					</Grid>
					<Grid size={{ xs: 12, md: 3 }}>
						<DateTimeInput
							label={messages.startTime}
							value={runtime.startDate}
							required={false}
							disabled={isSubmitting}
							onChange={(startDate) =>
								onRuntimeChange({ ...runtime, startDate })
							}
						/>
					</Grid>
					<Grid size={{ xs: 12, md: 3 }}>
						<DateTimeInput
							label={messages.endTime}
							value={runtime.endDate}
							required={false}
							disabled={isSubmitting}
							onChange={(endDate) => onRuntimeChange({ ...runtime, endDate })}
						/>
					</Grid>
					{rankingFields.map((key) => (
						<Grid key={key} size={{ xs: 12, md: 3 }}>
							<NumericInput
								label={messages.grandPrix[key]}
								step={1}
								max={Number.MAX_SAFE_INTEGER}
								value={runtime[key]}
								disabled={isSubmitting}
								onValueChange={(value) =>
									onRuntimeChange({ ...runtime, [key]: value })
								}
							/>
						</Grid>
					))}
				</Grid>
				<GrandPrixStageEditor
					grandPrixDetail={grandPrixDetail}
					disabled={isSubmitting}
					runtime={runtime}
					onRuntimeChange={onRuntimeChange}
				/>
				<Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
					<SaveButton
						type="submit"
						label={messages.grandPrix.save}
						loading={isSubmitting}
						disabled={isSubmitting}
					/>
				</Box>
			</Box>
		</AdminSectionCard>
	);
}

const rankingFields = [
	'guildTotalPoint',
	'guildRanking',
	'withinGuildRanking',
	'personalTotalPoint',
	'personalRanking',
] as const satisfies readonly (keyof GrandPrixRuntimeDraft)[];
