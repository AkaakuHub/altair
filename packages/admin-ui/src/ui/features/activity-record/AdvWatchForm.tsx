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
import { useCallback, useMemo } from 'react';
import { useAdminFormDraft } from '../../../hooks/useAdminFormDraft.ts';
import { useAdminUnsavedChangesContext } from '../../../hooks/useAdminUnsavedChanges.ts';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { AdminFormStatus } from '../../components/AdminFormStatus.tsx';
import { AdminSectionCard } from '../../components/AdminSectionCard.tsx';
import { SaveButton } from '../../components/SaveButton.tsx';
import {
	type AdvForm,
	createAdvForm,
	findFirstAdvId,
} from './activity-record-model.ts';

function advDraftKey(form: AdvForm): string {
	return `${form.advSeriesId}:${form.advDataId}`;
}

export function AdvWatchForm({
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
	onSave: (form: AdvForm, afterSaved: () => void) => void;
}): React.ReactElement {
	const { messages } = useAdminLanguage();
	const { requestAction } = useAdminUnsavedChangesContext();
	const resolveSource = useCallback(
		(current: AdvForm) =>
			seriesList.some(
				(series) =>
					series.advSeriesId === current.advSeriesId &&
					series.advList.some((adv) => adv.advDataId === current.advDataId),
			)
				? createAdvForm(
						seriesList,
						activityRecord,
						current.advSeriesId,
						current.advDataId,
					)
				: null,
		[activityRecord, seriesList],
	);
	const draft = useAdminFormDraft(
		createAdvForm(
			seriesList,
			activityRecord,
			seriesList[0]?.advSeriesId ?? 0,
			seriesList[0]?.advList[0]?.advDataId ?? 0,
		),
		resolveSource,
		advDraftKey,
	);
	const form = draft.value;
	const setForm = draft.setValue;

	const selectedSeries = useMemo(
		() => seriesList.find((series) => series.advSeriesId === form.advSeriesId),
		[seriesList, form.advSeriesId],
	);
	return (
		<AdminSectionCard title={messages.activityRecord.advWatch} sx={{ mb: 0 }}>
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
					<Grid size={{ xs: 12, md: 5 }}>
						<TextField
							select
							fullWidth
							size="small"
							label={messages.activityRecord.series}
							disabled={disabled}
							value={form.advSeriesId}
							onChange={(event) => {
								const id = Number(event.target.value);
								requestAction(() =>
									setForm(
										createAdvForm(
											seriesList,
											activityRecord,
											id,
											findFirstAdvId(seriesList, id),
										),
									),
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
					<Grid size={{ xs: 12, md: 4 }}>
						<TextField
							select
							fullWidth
							size="small"
							label={messages.activityRecord.adv}
							disabled={disabled}
							value={form.advDataId}
							onChange={(event) => {
								const advDataId = Number(event.target.value);
								requestAction(() =>
									setForm(
										createAdvForm(
											seriesList,
											activityRecord,
											form.advSeriesId,
											advDataId,
										),
									),
								);
							}}
						>
							{(selectedSeries?.advList ?? []).map((adv) => (
								<MenuItem key={adv.advDataId} value={adv.advDataId}>
									{adv.advDataId} {adv.title}
								</MenuItem>
							))}
						</TextField>
					</Grid>
					<Grid size={{ xs: 12, md: 3 }}>
						<FormControlLabel
							control={
								<Switch
									disabled={disabled}
									checked={form.isWatched}
									onChange={(event) =>
										setForm({ ...form, isWatched: event.target.checked })
									}
								/>
							}
							label={messages.activityRecord.watched}
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
