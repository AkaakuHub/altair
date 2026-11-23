import type {
	AdminCircle,
	AdminRegisteredUser,
} from '@altair/runtime/admin/dto/admin-visible-state-schema.ts';
import DeleteIcon from '@mui/icons-material/Delete';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { Button, Stack } from '@mui/material';
import { useCallback, useMemo } from 'react';
import { useAdminFormDraft } from '../../../hooks/useAdminFormDraft.ts';
import { useAdminUnsavedChangesContext } from '../../../hooks/useAdminUnsavedChanges.ts';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { AdminFormStatus } from '../../components/AdminFormStatus.tsx';
import { AdminSectionCard } from '../../components/AdminSectionCard.tsx';
import { RowActions } from '../../components/RowActions.tsx';
import { SearchablePaginatedDataTable } from '../../components/SearchablePaginatedDataTable.tsx';
import { PositionSelect, UserSelect } from './CircleSelectFields.tsx';
import type { CircleSubmitForm } from './circle-component-props.ts';
import {
	type CircleMemberForm,
	createCircleMemberForm,
	createMemberRows,
	filterCircleMembers,
	memberFormValues,
	memberPlayerFormValues,
} from './circle-model.ts';

type CircleMemberRow = ReturnType<typeof createMemberRows>[number];

function memberDraftKey(form: CircleMemberForm): string {
	return form.playerId;
}

export function CircleMembers({
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
	const { requestAction } = useAdminUnsavedChangesContext();
	const resolveSource = useCallback(
		(current: CircleMemberForm) =>
			createCircleMemberForm(circle, current.playerId),
		[circle],
	);
	const draft = useAdminFormDraft(
		createCircleMemberForm(circle, initialPlayerId),
		resolveSource,
		memberDraftKey,
	);
	const form = draft.value;
	const members = useMemo(
		() => createMemberRows(circle, users, messages.circle),
		[circle, users, messages.circle],
	);

	return (
		<>
			<AdminSectionCard title={messages.circle.members}>
				<AdminFormStatus
					conflicted={draft.conflicted}
					onReset={draft.reset}
					disabled={isSubmitting}
				/>
				<Stack
					component="form"
					direction={{ xs: 'column', md: 'row' }}
					spacing={2}
					onSubmit={(event) => {
						event.preventDefault();
						void submitForm(
							'/admin/circle/member',
							memberFormValues(form.playerId, form.positionType),
							() => draft.acceptSaved(form),
						);
					}}
				>
					<UserSelect
						label={messages.user}
						disabled={isSubmitting || !circle}
						users={users}
						value={form.playerId}
						onChange={(playerId) =>
							requestAction(() =>
								draft.setValue(createCircleMemberForm(circle, playerId)),
							)
						}
					/>
					<PositionSelect
						disabled={isSubmitting || !circle}
						value={form.positionType}
						onChange={(positionType) =>
							draft.setValue({ ...form, positionType })
						}
					/>
					<Button
						type="submit"
						loading={isSubmitting}
						variant="contained"
						startIcon={<GroupAddIcon />}
						disabled={isSubmitting || !circle || form.playerId.length === 0}
						sx={{ minWidth: 160 }}
					>
						{members.some((member) => member.playerId === form.playerId)
							? messages.circle.saveMember
							: messages.circle.addMember}
					</Button>
				</Stack>
			</AdminSectionCard>
			<SearchablePaginatedDataTable<CircleMemberRow>
				title={messages.circle.circleMembers}
				rows={members}
				emptyText={messages.circle.noMembers}
				getRowKey={(row) => row.playerId}
				searchLabel={messages.circle.searchMembers}
				filterRows={filterCircleMembers}
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
						key: 'position',
						label: messages.circle.position,
						render: (row) => row.positionLabel,
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
									onClick={() =>
										void submitForm(
											'/admin/circle/member/position',
											memberFormValues(row.playerId, 0),
										)
									}
								>
									{messages.circle.member}
								</Button>
								<Button
									size="small"
									disabled={isSubmitting}
									variant="outlined"
									onClick={() =>
										void submitForm(
											'/admin/circle/member/position',
											memberFormValues(row.playerId, 2),
										)
									}
								>
									{messages.circle.subleader}
								</Button>
								<Button
									size="small"
									disabled={isSubmitting}
									variant="outlined"
									startIcon={<SwapHorizIcon />}
									onClick={() =>
										void submitForm(
											'/admin/circle/member/transfer-leader',
											memberPlayerFormValues(row.playerId),
										)
									}
								>
									{messages.circle.leader}
								</Button>
								<Button
									size="small"
									disabled={isSubmitting}
									variant="outlined"
									onClick={() =>
										void submitForm(
											'/admin/circle/member/dismissal',
											memberPlayerFormValues(row.playerId),
										)
									}
								>
									{messages.circle.dismiss}
								</Button>
								<Button
									size="small"
									disabled={isSubmitting}
									color="error"
									variant="outlined"
									startIcon={<PersonRemoveIcon />}
									onClick={() =>
										void submitForm(
											'/admin/circle/member/expulsion',
											memberPlayerFormValues(row.playerId),
										)
									}
								>
									{messages.circle.expel}
								</Button>
								<Button
									size="small"
									disabled={isSubmitting}
									color="error"
									variant="outlined"
									startIcon={<DeleteIcon />}
									onClick={() =>
										void submitForm(
											'/admin/circle/member/delete',
											memberPlayerFormValues(row.playerId),
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
