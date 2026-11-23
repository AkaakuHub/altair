import { Box, Grid, MenuItem, Stack, TextField } from '@mui/material';
import { useCallback } from 'react';
import { useAdminFormDraft } from '../../../hooks/useAdminFormDraft.ts';
import { useAdminUnsavedChangesContext } from '../../../hooks/useAdminUnsavedChanges.ts';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { AdminFormStatus } from '../../components/AdminFormStatus.tsx';
import { AdminSectionCard } from '../../components/AdminSectionCard.tsx';
import { NumericInput } from '../../components/NumericInput.tsx';
import { SaveButton } from '../../components/SaveButton.tsx';
import type { AdminPageProps } from '../../page-props.ts';
import { findRegisteredUser } from '../player-state.ts';
import type { UserSubmitForm } from './user-form-props.ts';
import {
	type AccountLinkForm,
	accountLinkFormValues,
	createAccountLinkForm,
} from './user-model.ts';

function accountLinkDraftKey(form: AccountLinkForm): string {
	return form.playerId;
}

export function AccountLinkFormCard({
	data,
	isSubmitting,
	submitForm,
}: {
	data: AdminPageProps['data'];
	isSubmitting: boolean;
	submitForm: UserSubmitForm;
}): React.ReactElement {
	const { messages } = useAdminLanguage();
	const { requestAction } = useAdminUnsavedChangesContext();
	const resolveSource = useCallback(
		(current: AccountLinkForm) => {
			const user = findRegisteredUser(data, current.playerId);
			return user === undefined
				? null
				: createAccountLinkForm(user, data.state.accountLinks);
		},
		[data],
	);
	const draft = useAdminFormDraft(
		createAccountLinkForm(
			data.state.registeredUsers[0],
			data.state.accountLinks,
		),
		resolveSource,
		accountLinkDraftKey,
	);
	const form = draft.value;
	const setForm = draft.setValue;
	return (
		<AdminSectionCard title={messages.users.accountLink}>
			<AdminFormStatus
				conflicted={draft.conflicted}
				onReset={draft.reset}
				disabled={isSubmitting}
			/>
			<Box
				component="form"
				onSubmit={(event) => {
					event.preventDefault();
					if (!draft.isAvailable || isSubmitting) return;
					void submitForm(
						'/admin/account-link',
						accountLinkFormValues(form),
						() => draft.acceptSaved(form),
					);
				}}
			>
				<Grid container spacing={2}>
					<Grid size={{ xs: 12, md: 3 }}>
						<TextField
							select
							fullWidth
							size="small"
							label={messages.user}
							disabled={isSubmitting}
							value={form.playerId}
							onChange={(event) => {
								const playerId = event.target.value;
								requestAction(() =>
									setForm(
										createAccountLinkForm(
											findRegisteredUser(data, playerId),
											data.state.accountLinks,
										),
									),
								);
							}}
						>
							{data.state.registeredUsers.map((user) => (
								<MenuItem key={user.playerId} value={user.playerId}>
									{user.playerName} {user.playerId}
								</MenuItem>
							))}
						</TextField>
					</Grid>
					<Grid size={{ xs: 12, md: 2 }}>
						<NumericInput
							label={messages.users.provider}
							value={form.provider}
							min={1}
							max={1}
							step={1}
							disabled={isSubmitting}
							onValueChange={(provider) => setForm({ ...form, provider })}
						/>
					</Grid>
					<Grid size={{ xs: 12, md: 2 }}>
						<NumericInput
							label={messages.users.platform}
							value={form.platformType}
							min={1}
							max={9}
							step={1}
							disabled={isSubmitting}
							onValueChange={(platformType) =>
								setForm({ ...form, platformType })
							}
						/>
					</Grid>
					<Grid size={{ xs: 12, md: 5 }}>
						<TextField
							required
							fullWidth
							size="small"
							label={messages.users.accountToken}
							disabled={isSubmitting}
							value={form.idToken}
							onChange={(event) =>
								setForm({ ...form, idToken: event.target.value })
							}
						/>
					</Grid>
				</Grid>
				<Stack direction="row" sx={{ justifyContent: 'flex-end', mt: 2 }}>
					<SaveButton
						type="submit"
						label={messages.users.saveLink}
						loading={isSubmitting}
						disabled={isSubmitting || !draft.isAvailable}
					/>
				</Stack>
			</Box>
		</AdminSectionCard>
	);
}
