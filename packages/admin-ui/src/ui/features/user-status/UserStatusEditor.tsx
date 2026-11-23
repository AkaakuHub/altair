import { Box, Stack } from '@mui/material';
import { useCallback } from 'react';
import { useAdminFormDraft } from '../../../hooks/useAdminFormDraft.ts';
import { useAdminFormMutation } from '../../../hooks/useAdminFormMutation.ts';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { AdminFormStatus } from '../../components/AdminFormStatus.tsx';
import { AdminSectionCard } from '../../components/AdminSectionCard.tsx';
import { SaveButton } from '../../components/SaveButton.tsx';
import type { AdminPageProps } from '../../page-props.ts';
import { MemberFanLevelsSection } from './MemberFanLevelsSection.tsx';
import { UserStatusFieldsSection } from './UserStatusFieldsSection.tsx';
import {
	createUserStatusForm,
	userStatusFormValues,
} from './user-status-form.ts';

import {
	seasonOptionsWithCurrent,
	selectSeasonFanLevel,
	updateMemberFanLevel,
} from './user-status-model.ts';

function statusDraftKey(): string {
	return 'user-status';
}

export function UserStatusEditor({
	data,
	playerId,
	onReload,
}: AdminPageProps & { playerId: string }): React.ReactElement {
	const { messages } = useAdminLanguage();
	const resolveSource = useCallback(
		() => createUserStatusForm(data.userStatus),
		[data.userStatus],
	);
	const draft = useAdminFormDraft(
		createUserStatusForm(data.userStatus),
		resolveSource,
		statusDraftKey,
	);
	const form = draft.value;
	const setForm = draft.setValue;
	const { error, isSubmitting, submitForm, reportError } =
		useAdminFormMutation(onReload);

	return (
		<AdminSectionCard contentSx={{ p: { xs: 2, md: 3 } }}>
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
					if (isSubmitting || playerId.length === 0) return;
					try {
						void submitForm(
							'/admin/user-status',
							userStatusFormValues(playerId, form, messages),
							() => draft.acceptSaved(form),
						);
					} catch (cause: unknown) {
						reportError(cause);
					}
				}}
			>
				<Stack spacing={3}>
					<UserStatusFieldsSection
						disabled={isSubmitting}
						form={form}
						presentBoxCount={data.userStatus.presentBoxCount}
						seasonOptions={seasonOptionsWithCurrent(
							data.seasonList,
							form.seasonFanLevelSeasonId,
							messages.users.unknownSeason,
						)}
						onChange={setForm}
						onSeasonChange={(seasonId) =>
							setForm((current) => selectSeasonFanLevel(current, seasonId))
						}
					/>
					<MemberFanLevelsSection
						disabled={isSubmitting}
						memberFanLevels={form.memberFanLevels}
						onChange={(index, values) =>
							setForm((current) =>
								updateMemberFanLevel(
									current,
									index,
									values,
									data.memberFanLevelTable,
									data.seasonFanLevelTable,
								),
							)
						}
					/>
				</Stack>
				<Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
					<SaveButton
						type="submit"
						label={messages.users.saveStatus}
						loading={isSubmitting}
						disabled={isSubmitting || playerId.length === 0}
					/>
				</Box>
			</Box>
		</AdminSectionCard>
	);
}
