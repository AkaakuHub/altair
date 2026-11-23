import type { ActivityRecordSeriesSummary } from '@altair/runtime/admin/dto/admin-seed-schema.ts';
import type { AdminUserActivityRecord } from '@altair/runtime/admin/dto/admin-visible-state-schema.ts';
import {
	Box,
	FormControlLabel,
	Grid,
	MenuItem,
	Stack,
	Switch,
	TextField,
} from '@mui/material';
import { useCallback } from 'react';
import { useAdminFormDraft } from '../../../hooks/useAdminFormDraft.ts';
import { useAdminUnsavedChangesContext } from '../../../hooks/useAdminUnsavedChanges.ts';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { AdminFormStatus } from '../../components/AdminFormStatus.tsx';
import { AdminSectionCard } from '../../components/AdminSectionCard.tsx';
import { SaveButton } from '../../components/SaveButton.tsx';
import { createMonthForm, type MonthForm } from './activity-record-model.ts';

function monthDraftKey(form: MonthForm): string {
	return String(form.advSeriesId);
}

export function MonthlyBadgeForm({
	seriesList,
	activityRecord,
	disabled,
	isSubmitting,
	onSave,
}: {
	seriesList: ActivityRecordSeriesSummary[];
	activityRecord: AdminUserActivityRecord | undefined;
	disabled: boolean;
	isSubmitting: boolean;
	onSave: (form: MonthForm, afterSaved: () => void) => void;
}): React.ReactElement {
	const { messages } = useAdminLanguage();
	const { requestAction } = useAdminUnsavedChangesContext();
	const resolveSource = useCallback(
		(current: MonthForm) =>
			seriesList.some((series) => series.advSeriesId === current.advSeriesId)
				? createMonthForm(activityRecord, current.advSeriesId)
				: null,
		[activityRecord, seriesList],
	);
	const draft = useAdminFormDraft(
		createMonthForm(activityRecord, seriesList[0]?.advSeriesId ?? 0),
		resolveSource,
		monthDraftKey,
	);
	const form = draft.value;
	const setForm = draft.setValue;

	return (
		<AdminSectionCard
			title={messages.activityRecord.monthlyBadge}
			sx={{ mb: 0 }}
		>
			<AdminFormStatus
				conflicted={draft.conflicted}
				onReset={draft.reset}
				disabled={disabled}
			/>
			<Box
				component="form"
				onSubmit={(event) => {
					event.preventDefault();
					if (!disabled && draft.isAvailable)
						onSave(form, () => draft.acceptSaved(form));
				}}
			>
				<Grid container spacing={2}>
					<Grid size={{ xs: 12, md: 7 }}>
						<TextField
							select
							fullWidth
							size="small"
							label={messages.activityRecord.series}
							disabled={disabled}
							value={form.advSeriesId}
							onChange={(event) => {
								const seriesId = Number(event.target.value);
								requestAction(() =>
									setForm(createMonthForm(activityRecord, seriesId)),
								);
							}}
						>
							{seriesList.map((series) => (
								<MenuItem key={series.advSeriesId} value={series.advSeriesId}>
									{series.advSeriesId} {series.name}
								</MenuItem>
							))}
						</TextField>
					</Grid>
					<Grid size={{ xs: 12, md: 3 }}>
						<FormControlLabel
							control={
								<Switch
									disabled={disabled}
									checked={form.isDisplayed}
									onChange={(event) =>
										setForm({ ...form, isDisplayed: event.target.checked })
									}
								/>
							}
							label={messages.activityRecord.displayed}
						/>
					</Grid>
				</Grid>
				<Stack direction="row" sx={{ justifyContent: 'flex-end', mt: 2 }}>
					<SaveButton
						type="submit"
						loading={isSubmitting}
						disabled={disabled || !draft.isAvailable}
					/>
				</Stack>
			</Box>
		</AdminSectionCard>
	);
}
