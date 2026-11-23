import AddIcon from '@mui/icons-material/Add';
import { Box, Button, Grid, Stack, TextField } from '@mui/material';
import { useState } from 'react';
import { hasAdminDraftChanges } from '../../../domain/forms/draft.ts';
import { useAdminUnsavedChanges } from '../../../hooks/useAdminUnsavedChanges.ts';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { AdminSectionCard } from '../../components/AdminSectionCard.tsx';
import { NumericInput } from '../../components/NumericInput.tsx';
import type { UserSubmitForm } from './user-form-props.ts';
import {
	createNewUserForm,
	type NewUserForm,
	newUserFormValues,
} from './user-model.ts';

export function NewUserFormCard({
	isSubmitting,
	submitForm,
}: {
	isSubmitting: boolean;
	submitForm: UserSubmitForm;
}): React.ReactElement {
	const { messages } = useAdminLanguage();
	const [form, setForm] = useState<NewUserForm>(createNewUserForm);
	useAdminUnsavedChanges(hasAdminDraftChanges(createNewUserForm(), form));
	return (
		<AdminSectionCard title={messages.users.addUser}>
			<Box
				component="form"
				onSubmit={(event) => {
					event.preventDefault();
					void submitForm(
						'/admin/registered-user/add',
						newUserFormValues(form),
						() => setForm(createNewUserForm()),
					);
				}}
			>
				<Grid container spacing={2}>
					<Grid size={{ xs: 12, md: 8 }}>
						<TextField
							required
							fullWidth
							size="small"
							label={messages.name}
							disabled={isSubmitting}
							value={form.playerName}
							onChange={(event) =>
								setForm({ ...form, playerName: event.target.value })
							}
						/>
					</Grid>
					<Grid size={{ xs: 12, md: 4 }}>
						<NumericInput
							label={messages.level}
							value={form.playerLevel}
							min={1}
							max={9999}
							step={1}
							disabled={isSubmitting}
							onValueChange={(playerLevel) => setForm({ ...form, playerLevel })}
						/>
					</Grid>
					<Grid size={{ xs: 12, md: 4 }}>
						<TextField
							required
							fullWidth
							size="small"
							label={messages.users.birthday}
							disabled={isSubmitting}
							value={form.birthday}
							onChange={(event) =>
								setForm({ ...form, birthday: event.target.value })
							}
						/>
					</Grid>
				</Grid>
				<Stack direction="row" sx={{ justifyContent: 'flex-end', mt: 2 }}>
					<Button
						type="submit"
						variant="contained"
						startIcon={<AddIcon />}
						loading={isSubmitting}
					>
						{messages.users.addUser}
					</Button>
				</Stack>
			</Box>
		</AdminSectionCard>
	);
}
