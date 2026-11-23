import type {
	AdminCircle,
	AdminRegisteredUser,
} from '@altair/runtime/admin/dto/admin-visible-state-schema.ts';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Button, Grid, Stack, TextField } from '@mui/material';
import { useCallback } from 'react';
import { useAdminFormDraft } from '../../../hooks/useAdminFormDraft.ts';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { AdminFormStatus } from '../../components/AdminFormStatus.tsx';
import { AdminSectionCard } from '../../components/AdminSectionCard.tsx';
import { NumericInput } from '../../components/NumericInput.tsx';
import { SaveButton } from '../../components/SaveButton.tsx';
import { UserSelect } from './CircleSelectFields.tsx';
import type { CircleSubmitForm } from './circle-component-props.ts';
import {
	type CircleForm,
	circleFormValues,
	createCircleForm,
} from './circle-model.ts';

function circleDraftKey(): string {
	return 'circle';
}

export function CircleSettingsCard({
	circle,
	users,
	selectedPlayerId,
	isSubmitting,
	submitForm,
}: {
	circle: AdminCircle | null | undefined;
	users: AdminRegisteredUser[];
	selectedPlayerId: string;
	isSubmitting: boolean;
	submitForm: CircleSubmitForm;
}): React.ReactElement {
	const { messages } = useAdminLanguage();
	const resolveSource = useCallback(
		(current: CircleForm) =>
			createCircleForm(circle, current.leaderPlayerId || selectedPlayerId),
		[circle, selectedPlayerId],
	);
	const draft = useAdminFormDraft(
		createCircleForm(circle, selectedPlayerId),
		resolveSource,
		circleDraftKey,
	);
	const form = draft.value;
	const setForm = draft.setValue;

	return (
		<AdminSectionCard title={messages.circle.settings}>
			<AdminFormStatus
				conflicted={draft.conflicted}
				onReset={draft.reset}
				disabled={isSubmitting}
			/>
			<Box
				component="form"
				onSubmit={(event) => {
					event.preventDefault();
					void submitForm('/admin/circle', circleFormValues(form), () =>
						draft.acceptSaved(form),
					);
				}}
			>
				<Grid container spacing={2}>
					<Grid size={{ xs: 12, md: 3 }}>
						<UserSelect
							label={messages.circle.leader}
							disabled={isSubmitting}
							users={users}
							value={form.leaderPlayerId}
							onChange={(leaderPlayerId) =>
								setForm({ ...form, leaderPlayerId })
							}
						/>
					</Grid>
					<Grid size={{ xs: 12, md: 3 }}>
						<TextField
							fullWidth
							size="small"
							disabled={isSubmitting}
							label={messages.circle.searchGuildKey}
							value={form.searchGuildKey}
							onChange={(event) =>
								setForm({ ...form, searchGuildKey: event.target.value })
							}
						/>
					</Grid>
					<Grid size={{ xs: 12, md: 3 }}>
						<TextField
							required
							fullWidth
							size="small"
							disabled={isSubmitting}
							label={messages.circle.circleName}
							value={form.guildName}
							onChange={(event) =>
								setForm({ ...form, guildName: event.target.value })
							}
						/>
					</Grid>
					<Grid size={{ xs: 12, md: 3 }}>
						<NumericInput
							label={messages.circle.actionPolicy}
							value={form.guildPolicyAction}
							min={0}
							max={9}
							step={1}
							disabled={isSubmitting}
							onValueChange={(guildPolicyAction) =>
								setForm({ ...form, guildPolicyAction })
							}
						/>
					</Grid>
					<Grid size={{ xs: 12, md: 3 }}>
						<NumericInput
							label={messages.circle.recruitingPolicy}
							value={form.guildPolicyRecruiting}
							min={0}
							max={9}
							step={1}
							disabled={isSubmitting}
							onValueChange={(guildPolicyRecruiting) =>
								setForm({ ...form, guildPolicyRecruiting })
							}
						/>
					</Grid>
					<Grid size={{ xs: 12 }}>
						<TextField
							required
							fullWidth
							multiline
							minRows={2}
							size="small"
							disabled={isSubmitting}
							label={messages.circle.description}
							value={form.guildComment}
							onChange={(event) =>
								setForm({ ...form, guildComment: event.target.value })
							}
						/>
					</Grid>
					<Grid size={{ xs: 12 }}>
						<TextField
							fullWidth
							multiline
							minRows={2}
							size="small"
							disabled={isSubmitting}
							label={messages.circle.iconPartsInfo}
							value={form.guildIconPartsInfo}
							onChange={(event) =>
								setForm({ ...form, guildIconPartsInfo: event.target.value })
							}
						/>
					</Grid>
				</Grid>
				<Stack
					direction={{ xs: 'column-reverse', sm: 'row' }}
					spacing={1}
					sx={{ justifyContent: 'flex-end', mt: 2 }}
				>
					<Button
						color="error"
						variant="outlined"
						startIcon={<DeleteIcon />}
						disabled={isSubmitting || !circle}
						onClick={() =>
							void submitForm('/admin/circle/delete', {}, () =>
								draft.acceptSaved(createCircleForm(null, selectedPlayerId)),
							)
						}
					>
						{messages.remove}
					</Button>
					<SaveButton
						type="submit"
						label={
							circle ? messages.circle.saveCircle : messages.circle.createCircle
						}
						loading={isSubmitting}
						disabled={isSubmitting || form.leaderPlayerId.length === 0}
					/>
				</Stack>
			</Box>
		</AdminSectionCard>
	);
}
