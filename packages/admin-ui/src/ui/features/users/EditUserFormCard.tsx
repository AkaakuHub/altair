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
	createEditingUserForm,
	type EditingUserForm,
	editingUserFormValues,
	unsetBirthday,
} from './user-model.ts';

type EditUserDraft = {
	selectedPlayerId: string;
	user: EditingUserForm | null;
};

function editUserDraftKey(value: EditUserDraft): string {
	return value.selectedPlayerId;
}

export function EditUserFormCard({
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
		(current: EditUserDraft): EditUserDraft | null => {
			const selected = findRegisteredUser(data, current.selectedPlayerId);
			return selected === undefined
				? null
				: {
						selectedPlayerId: current.selectedPlayerId,
						user: createEditingUserForm(selected),
					};
		},
		[data],
	);
	const draft = useAdminFormDraft<EditUserDraft>(
		{ selectedPlayerId: '', user: null },
		resolveSource,
		editUserDraftKey,
	);
	const { selectedPlayerId, user } = draft.value;
	function setUser(value: EditingUserForm | null): void {
		draft.setValue((current) => ({ ...current, user: value }));
	}
	return (
		<AdminSectionCard title={messages.users.editUser}>
			<AdminFormStatus
				conflicted={draft.conflicted}
				onReset={draft.reset}
				disabled={isSubmitting}
			/>
			<Box
				component="form"
				onSubmit={(event) => {
					event.preventDefault();
					if (user && draft.isAvailable && !isSubmitting) {
						void submitForm(
							'/admin/registered-user',
							editingUserFormValues(selectedPlayerId, user),
							() => {
								const saved = {
									selectedPlayerId: user.playerId.trim(),
									user: { ...user, playerId: user.playerId.trim() },
								};
								draft.setValue(saved);
								draft.acceptSaved(saved);
							},
						);
					}
				}}
			>
				<Grid container spacing={2}>
					<Grid size={{ xs: 12, md: 3 }}>
						<TextField
							select
							fullWidth
							size="small"
							label={messages.users.target}
							value={selectedPlayerId}
							disabled={isSubmitting}
							onChange={(event) => {
								const playerId = event.target.value;
								requestAction(() => {
									const selectedUser = findRegisteredUser(data, playerId);
									draft.setValue({
										selectedPlayerId: playerId,
										user:
											selectedUser === undefined
												? null
												: createEditingUserForm(selectedUser),
									});
								});
							}}
						>
							{data.state.registeredUsers.map((registeredUser) => (
								<MenuItem
									key={registeredUser.playerId}
									value={registeredUser.playerId}
								>
									{registeredUser.playerName} {registeredUser.playerId}
								</MenuItem>
							))}
						</TextField>
					</Grid>
					<Grid size={{ xs: 12, md: 3 }}>
						<TextField
							required
							fullWidth
							size="small"
							label={messages.users.playerId}
							value={user?.playerId ?? ''}
							disabled={user === null || isSubmitting}
							onChange={(event) =>
								setUser(user ? { ...user, playerId: event.target.value } : null)
							}
						/>
					</Grid>
					<Grid size={{ xs: 12, md: 3 }}>
						<TextField
							required
							fullWidth
							size="small"
							label={messages.name}
							value={user?.playerName ?? ''}
							disabled={user === null || isSubmitting}
							onChange={(event) =>
								setUser(
									user ? { ...user, playerName: event.target.value } : null,
								)
							}
						/>
					</Grid>
					<Grid size={{ xs: 12, md: 3 }}>
						<NumericInput
							label={messages.level}
							value={user?.playerLevel ?? ''}
							min={1}
							max={9999}
							step={1}
							disabled={user === null || isSubmitting}
							onValueChange={(playerLevel) =>
								setUser(user ? { ...user, playerLevel } : null)
							}
						/>
					</Grid>
					<Grid size={{ xs: 12, md: 6 }}>
						<TextField
							required
							fullWidth
							size="small"
							label={messages.users.birthday}
							value={user?.birthday ?? unsetBirthday}
							disabled={user === null || isSubmitting}
							onChange={(event) =>
								setUser(user ? { ...user, birthday: event.target.value } : null)
							}
						/>
					</Grid>
					<Grid size={{ xs: 12, md: 6 }}>
						<TextField
							required
							fullWidth
							size="small"
							label={messages.users.deviceId}
							value={user?.deviceSpecificId ?? ''}
							disabled={user === null || isSubmitting}
							onChange={(event) =>
								setUser(
									user
										? { ...user, deviceSpecificId: event.target.value }
										: null,
								)
							}
						/>
					</Grid>
					<Grid size={{ xs: 12, md: 6 }}>
						<TextField
							required
							fullWidth
							size="small"
							label={messages.users.sessionToken}
							value={user?.sessionToken ?? ''}
							disabled={user === null || isSubmitting}
							onChange={(event) =>
								setUser(
									user ? { ...user, sessionToken: event.target.value } : null,
								)
							}
						/>
					</Grid>
				</Grid>
				<Stack direction="row" sx={{ justifyContent: 'flex-end', mt: 2 }}>
					<SaveButton
						type="submit"
						label={messages.users.saveUser}
						disabled={isSubmitting || user === null || !draft.isAvailable}
						loading={isSubmitting}
					/>
				</Stack>
			</Box>
		</AdminSectionCard>
	);
}
