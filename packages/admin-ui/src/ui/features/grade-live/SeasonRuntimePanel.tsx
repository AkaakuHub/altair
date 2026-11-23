import { Box, Button, Chip, Grid, MenuItem, TextField } from '@mui/material';
import { useCallback, useRef, useState } from 'react';
import {
	createDateTimeDraft,
	dateTimeDraftToIso,
} from '../../../domain/forms/dateTimeDraft.ts';
import type { AdminFormValues } from '../../../form-value.ts';
import { useAdminFormDraft } from '../../../hooks/useAdminFormDraft.ts';
import { useAdminUnsavedChangesContext } from '../../../hooks/useAdminUnsavedChanges.ts';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { AdminFormStatus } from '../../components/AdminFormStatus.tsx';
import { AdminSectionCard } from '../../components/AdminSectionCard.tsx';
import type { DataTableColumn } from '../../components/DataTable.tsx';
import { DateTimeInput } from '../../components/DateTimeInput.tsx';
import { SaveButton } from '../../components/SaveButton.tsx';
import { SearchablePaginatedDataTable } from '../../components/SearchablePaginatedDataTable.tsx';
import {
	createSeasonRuntimeDraft,
	type SeasonDraft,
	type SeasonRuntime,
} from './season-runtime-model.ts';

export type SeasonRuntimeSubmit = (
	action: string,
	values: AdminFormValues,
	afterSubmit?: () => void,
) => Promise<void>;
type RuntimeConfiguration =
	| { path: 'gradeLive'; activeId: 'activeGradeQuestSeasonId' }
	| { path: 'gradeChallenge'; activeId: 'activeGradeChallengeSeasonId' };

function runtimeKey(): string {
	return 'season-runtime';
}

export function SeasonRuntimePanel<
	Row extends { startDate: string; endDate: string },
>({
	title,
	configuration,
	source,
	rows,
	getSeasonId,
	getSeasonLabel,
	columns,
	isSubmitting,
	submitForm,
}: {
	title: string;
	configuration: RuntimeConfiguration;
	source: SeasonRuntime;
	rows: Row[];
	getSeasonId(row: Row): number;
	getSeasonLabel(row: Row): string;
	columns: Array<DataTableColumn<Row>>;
	isSubmitting: boolean;
	submitForm: SeasonRuntimeSubmit;
}): React.ReactElement {
	const { messages } = useAdminLanguage();
	const { requestAction } = useAdminUnsavedChangesContext();
	const resolveSource = useCallback(
		() => createSeasonRuntimeDraft(source),
		[source],
	);
	const draft = useAdminFormDraft(
		createSeasonRuntimeDraft(source),
		resolveSource,
		runtimeKey,
	);
	const form = draft.value;
	const formRef = useRef<HTMLFormElement | null>(null);
	const [error, setError] = useState<string | null>(null);
	const selectSeason = (row: Row): SeasonDraft => ({
		...form,
		seasonId: getSeasonId(row),
		status: 1,
		startDate: createDateTimeDraft(row.startDate === '' ? null : row.startDate),
		endDate: createDateTimeDraft(row.endDate === '' ? null : row.endDate),
	});
	const filterRows = useCallback(
		(values: Row[], query: string) => {
			const normalized = query.trim().toLowerCase();
			return normalized === ''
				? values
				: values.filter((row) =>
						[
							getSeasonId(row),
							getSeasonLabel(row),
							row.startDate,
							row.endDate,
						].some((value) => String(value).toLowerCase().includes(normalized)),
					);
		},
		[getSeasonId, getSeasonLabel],
	);
	async function save(next: SeasonDraft): Promise<void> {
		if (isSubmitting || formRef.current?.reportValidity() !== true) return;
		setError(null);
		try {
			const normalized = {
				...next,
				startDate: dateTimeDraftToIso(next.startDate, messages.validation),
				endDate: dateTimeDraftToIso(next.endDate, messages.validation),
			};
			await submitForm(
				'/admin/state',
				{
					[`${configuration.path}.${configuration.activeId}`]: next.seasonId,
					[`${configuration.path}.status`]: next.status,
					[`${configuration.path}.startDate`]: normalized.startDate,
					[`${configuration.path}.endDate`]: normalized.endDate,
				},
				() => draft.acceptSaved(createSeasonRuntimeDraft(normalized)),
			);
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : String(cause));
		}
	}
	return (
		<>
			<AdminFormStatus
				error={error}
				conflicted={draft.conflicted}
				onReset={draft.reset}
				disabled={isSubmitting}
			/>
			<AdminSectionCard title={title}>
				<Box
					component="form"
					ref={formRef}
					onSubmit={(event) => {
						event.preventDefault();
						void save(form);
					}}
				>
					<Grid container spacing={2}>
						<Grid size={{ xs: 12, md: 8 }}>
							<TextField
								select
								fullWidth
								size="small"
								label={messages.gradeLive.season}
								value={form.seasonId}
								disabled={isSubmitting}
								onChange={(event) => {
									const selected = rows.find(
										(row) => getSeasonId(row) === Number(event.target.value),
									);
									if (selected !== undefined)
										requestAction(() => draft.setValue(selectSeason(selected)));
								}}
							>
								{rows.map((row) => (
									<MenuItem key={getSeasonId(row)} value={getSeasonId(row)}>
										{getSeasonLabel(row)}
									</MenuItem>
								))}
							</TextField>
						</Grid>
						<Grid size={{ xs: 12, md: 4 }}>
							<TextField
								select
								fullWidth
								size="small"
								label={messages.status}
								value={form.status}
								disabled={isSubmitting}
								onChange={(event) =>
									draft.setValue({
										...form,
										status: Number(event.target.value),
									})
								}
							>
								<MenuItem value={1}>{messages.gradeLive.open}</MenuItem>
								<MenuItem value={0}>{messages.gradeLive.closed}</MenuItem>
							</TextField>
						</Grid>
						<Grid size={{ xs: 12, md: 6 }}>
							<DateTimeInput
								label={messages.startTime}
								value={form.startDate}
								required={false}
								disabled={isSubmitting}
								onChange={(startDate) => draft.setValue({ ...form, startDate })}
							/>
						</Grid>
						<Grid size={{ xs: 12, md: 6 }}>
							<DateTimeInput
								label={messages.endTime}
								value={form.endDate}
								required={false}
								disabled={isSubmitting}
								onChange={(endDate) => draft.setValue({ ...form, endDate })}
							/>
						</Grid>
						<Grid size={{ xs: 12 }}>
							<SaveButton
								label={messages.gradeLive.saveTitle(title)}
								type="submit"
								disabled={isSubmitting}
								loading={isSubmitting}
							/>
						</Grid>
					</Grid>
				</Box>
			</AdminSectionCard>
			<SearchablePaginatedDataTable
				title={messages.gradeLive.seasons(title)}
				rows={rows}
				emptyText={messages.gradeLive.noSeasons}
				getRowKey={(row) => String(getSeasonId(row))}
				searchLabel={messages.gradeLive.searchSeasons}
				filterRows={filterRows}
				selectedRowKey={String(form.seasonId)}
				columns={[
					...columns,
					{
						key: 'action',
						label: messages.action,
						render: (row) =>
							getSeasonId(row) === source.seasonId ? (
								<Chip size="small" color="primary" label={messages.active} />
							) : (
								<Button
									size="small"
									variant="outlined"
									disabled={isSubmitting}
									onClick={() =>
										requestAction(() => void save(selectSeason(row)))
									}
								>
									{messages.grandPrix.setActive}
								</Button>
							),
					},
				]}
			/>
		</>
	);
}
