import type { AdminStateResponse } from '@altair/runtime/admin/dto/admin-state-response-schema.ts';
import type { RuntimeResourceOptionIds } from '@altair/runtime/admin/dto/runtime-resource-version-schema.ts';
import { Box, Grid, MenuItem, TextField } from '@mui/material';
import { useCallback } from 'react';
import { useAdminFormDraft } from '../../../hooks/useAdminFormDraft.ts';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { AdminFormStatus } from '../../components/AdminFormStatus.tsx';
import { AdminSectionCard } from '../../components/AdminSectionCard.tsx';
import { SaveButton } from '../../components/SaveButton.tsx';

type ResourceVersionPanelProps = {
	data: AdminStateResponse;
	isSubmitting: boolean;
	error: string | null;
	submitRuntimeSwitch: (
		selection: RuntimeResourceOptionIds,
		afterSubmit?: () => void,
	) => Promise<void>;
};

function resourceVersionDraftKey(): string {
	return 'resource-version';
}

export function ResourceVersionPanel({
	data,
	isSubmitting,
	error,
	submitRuntimeSwitch,
}: ResourceVersionPanelProps): React.ReactElement {
	const { messages } = useAdminLanguage();
	const resolveSource = useCallback(
		() => ({
			android:
				data.runtimeReleaseOptions.find(
					(entry) => entry.platform === 'android' && entry.isActive,
				)?.id ?? '',
			ios:
				data.runtimeReleaseOptions.find(
					(entry) => entry.platform === 'ios' && entry.isActive,
				)?.id ?? '',
		}),
		[data.runtimeReleaseOptions],
	);
	const draft = useAdminFormDraft(
		resolveSource(),
		resolveSource,
		resourceVersionDraftKey,
	);

	return (
		<AdminSectionCard title={messages.serverSettings.resourceVersion}>
			<AdminFormStatus
				error={error}
				conflicted={draft.conflicted}
				onReset={draft.reset}
				disabled={isSubmitting}
			/>
			<Box
				component="form"
				onSubmit={(event) => {
					event.preventDefault();
					void submitRuntimeSwitch(draft.value, () =>
						draft.acceptSaved(draft.value),
					);
				}}
			>
				<Grid container spacing={2}>
					{(['android', 'ios'] as const).map((platform) => (
						<Grid key={platform} size={{ xs: 12, md: 6 }}>
							<TextField
								select
								fullWidth
								size="small"
								label={
									platform === 'android'
										? messages.serverSettings.androidResourceVersion
										: messages.serverSettings.iosResourceVersion
								}
								value={draft.value[platform]}
								disabled={isSubmitting}
								onChange={(event) =>
									draft.setValue({
										...draft.value,
										[platform]: event.target.value,
									})
								}
							>
								{data.runtimeReleaseOptions
									.filter((entry) => entry.platform === platform)
									.map((entry) => (
										<MenuItem key={entry.id} value={entry.id}>
											{entry.clientVersion} {entry.resourceVersion}
										</MenuItem>
									))}
							</TextField>
						</Grid>
					))}
				</Grid>
				<Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
					<SaveButton
						type="submit"
						label={messages.serverSettings.switchAndRestart}
						loading={isSubmitting}
						disabled={
							isSubmitting ||
							draft.value.android === '' ||
							draft.value.ios === ''
						}
					/>
				</Box>
			</Box>
		</AdminSectionCard>
	);
}
