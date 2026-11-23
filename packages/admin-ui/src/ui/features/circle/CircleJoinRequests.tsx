import type {
	AdminCircle,
	AdminRegisteredUser,
} from '@altair/runtime/admin/dto/admin-visible-state-schema.ts';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import { Button, Stack } from '@mui/material';
import { useMemo, useState } from 'react';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { AdminSectionCard } from '../../components/AdminSectionCard.tsx';
import { RowActions } from '../../components/RowActions.tsx';
import { SearchablePaginatedDataTable } from '../../components/SearchablePaginatedDataTable.tsx';
import { UserSelect } from './CircleSelectFields.tsx';
import type { CircleSubmitForm } from './circle-component-props.ts';
import {
	createJoinRequestForm,
	createJoinRequestRows,
	filterJoinRequests,
	type JoinRequestForm,
	joinRequestFormValues,
	joinRequestIdFormValues,
} from './circle-model.ts';

type CircleJoinRequestRow = ReturnType<typeof createJoinRequestRows>[number];

export function CircleJoinRequests({
	circle,
	users,
	initialPlayerId,
	isSubmitting,
	submitForm,
}: {
	circle: AdminCircle | null | undefined;
	users: AdminRegisteredUser[];
	initialPlayerId: string;
	isSubmitting: boolean;
	submitForm: CircleSubmitForm;
}): React.ReactElement {
	const { messages } = useAdminLanguage();
	const [form, setForm] = useState<JoinRequestForm>(
		createJoinRequestForm(initialPlayerId),
	);
	const requests = useMemo(
		() => createJoinRequestRows(circle, users),
		[circle, users],
	);

	async function submitJoinRequest(): Promise<void> {
		await submitForm(
			'/admin/circle/join-request',
			joinRequestFormValues(form),
			() => setForm(createJoinRequestForm(form.playerId)),
		);
	}

	return (
		<>
			<AdminSectionCard title={messages.circle.joinRequests}>
				<Stack
					component="form"
					direction={{ xs: 'column', md: 'row' }}
					spacing={2}
					onSubmit={(event) => {
						event.preventDefault();
						void submitJoinRequest();
					}}
				>
					<UserSelect
						label={messages.user}
						disabled={isSubmitting || !circle}
						users={users}
						value={form.playerId}
						onChange={(playerId) => setForm({ ...form, playerId })}
					/>
					<Button
						type="submit"
						loading={isSubmitting}
						variant="contained"
						disabled={isSubmitting || !circle || form.playerId.length === 0}
						sx={{ minWidth: 160 }}
					>
						{messages.circle.add}
					</Button>
				</Stack>
			</AdminSectionCard>
			<SearchablePaginatedDataTable<CircleJoinRequestRow>
				title={messages.circle.joinRequests}
				rows={requests}
				emptyText={messages.circle.noJoinRequests}
				getRowKey={(row) => row.guildInvitationId}
				searchLabel={messages.circle.searchJoinRequests}
				filterRows={filterJoinRequests}
				columns={[
					{
						key: 'name',
						label: messages.name,
						render: (row) => row.playerName,
					},
					{
						key: 'id',
						label: messages.circle.playerId,
						render: (row) => row.playerId,
					},
					{
						key: 'invitation',
						label: messages.circle.invitationId,
						render: (row) => row.guildInvitationId,
					},
					{
						key: 'time',
						label: messages.created,
						render: (row) => row.createTime,
					},
					{
						key: 'action',
						label: messages.action,
						render: (row) => (
							<RowActions wrap>
								<Button
									size="small"
									disabled={isSubmitting}
									variant="outlined"
									startIcon={<CheckCircleIcon />}
									onClick={() =>
										void submitForm(
											'/admin/circle/approve-join',
											joinRequestIdFormValues(row.guildInvitationId),
										)
									}
								>
									{messages.circle.approve}
								</Button>
								<Button
									size="small"
									disabled={isSubmitting}
									variant="outlined"
									startIcon={<CancelIcon />}
									onClick={() =>
										void submitForm(
											'/admin/circle/reject-join',
											joinRequestIdFormValues(row.guildInvitationId),
										)
									}
								>
									{messages.circle.reject}
								</Button>
								<Button
									size="small"
									disabled={isSubmitting}
									color="error"
									variant="outlined"
									startIcon={<DeleteIcon />}
									onClick={() =>
										void submitForm(
											'/admin/circle/join-request/delete',
											joinRequestIdFormValues(row.guildInvitationId),
										)
									}
								>
									{messages.remove}
								</Button>
							</RowActions>
						),
					},
				]}
			/>
		</>
	);
}
