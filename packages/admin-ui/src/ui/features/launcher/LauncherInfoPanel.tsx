import type { AdminStateResponse } from '@altair/runtime/admin/dto/admin-state-response-schema.ts';
import { Box, Grid, MenuItem, TextField } from '@mui/material';
import { useCallback } from 'react';
import {
	editableLauncherInfoKeys,
	launcherInfoKeys,
} from '../../../../../../src/state/launcher-info-keys.ts';
import type { AdminFormValues } from '../../../form-value.ts';
import { useAdminFormDraft } from '../../../hooks/useAdminFormDraft.ts';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { AdminFormStatus } from '../../components/AdminFormStatus.tsx';
import { AdminSectionCard } from '../../components/AdminSectionCard.tsx';
import { SaveButton } from '../../components/SaveButton.tsx';

type LauncherInfoPanelProps = {
	data: AdminStateResponse;
	isSubmitting: boolean;
	submitForm: (
		path: string,
		values: AdminFormValues,
		afterSubmit?: () => void,
	) => Promise<void>;
};

const launcherStatusOptions = [0, 1, 2, 3] as const;

function launcherInfoDraftKey(): string {
	return 'launcher-info';
}

export function LauncherInfoPanel({
	data,
	isSubmitting,
	submitForm,
}: LauncherInfoPanelProps): React.ReactElement {
	const { messages } = useAdminLanguage();
	const resolveSource = useCallback(() => createLauncherInfoForm(data), [data]);
	const draft = useAdminFormDraft(
		resolveSource(),
		resolveSource,
		launcherInfoDraftKey,
	);
	const form = draft.value;
	const setForm = draft.setValue;

	async function save(): Promise<void> {
		await submitForm('/admin/state', launcherInfoFormValues(form), () =>
			draft.acceptSaved(form),
		);
	}

	return (
		<AdminSectionCard title={messages.serverSettings.launcherStatus}>
			<AdminFormStatus
				conflicted={draft.conflicted}
				onReset={draft.reset}
				disabled={isSubmitting}
			/>
			<Box
				component="form"
				onSubmit={(event) => {
					event.preventDefault();
					void save();
				}}
			>
				<Grid container spacing={2}>
					{launcherInfoKeys.map((key) => (
						<Grid key={key} size={{ xs: 12, sm: 6, md: 4 }}>
							<TextField
								select
								fullWidth
								size="small"
								label={messages.serverSettings.launcherFields[key]}
								value={
									key === 'circle_status'
										? data.userStatus.fanLevel >= 13
											? 1
											: 0
										: (form[key] ?? 1)
								}
								disabled={isSubmitting || key === 'circle_status'}
								onChange={(event) =>
									setForm({
										...form,
										[key]: Number(event.target.value),
									})
								}
							>
								{launcherStatusOptions.map((value) => (
									<MenuItem key={value} value={value}>
										{value} {messages.serverSettings.launcherStatuses[value]}
									</MenuItem>
								))}
							</TextField>
						</Grid>
					))}
				</Grid>
				<Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
					<SaveButton
						type="submit"
						label={messages.serverSettings.saveLauncher}
						loading={isSubmitting}
						disabled={isSubmitting}
					/>
				</Box>
			</Box>
		</AdminSectionCard>
	);
}

function createLauncherInfoForm(
	data: AdminStateResponse,
): Record<string, number> {
	return Object.fromEntries(
		editableLauncherInfoKeys.map((key) => [
			key,
			data.state.launcherInfo[key] ?? 1,
		]),
	);
}

function launcherInfoFormValues(form: Record<string, number>): AdminFormValues {
	return Object.fromEntries(
		editableLauncherInfoKeys.map((key) => [`launcher.${key}`, form[key] ?? 1]),
	);
}
