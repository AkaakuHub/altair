import { useAdminFormMutation } from '../../../hooks/useAdminFormMutation.ts';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { AdminFormStatus } from '../../components/AdminFormStatus.tsx';
import { PageHeader } from '../../components/PageHeader.tsx';
import type { AdminPageProps } from '../../page-props.ts';
import {
	findRegisteredUser,
	getSelectedAdminPlayerId,
} from '../player-state.ts';
import { CircleChatLogs } from './CircleChatLogs.tsx';
import { CircleJoinRequests } from './CircleJoinRequests.tsx';
import { CircleMembers } from './CircleMembers.tsx';
import { CircleSettingsCard } from './CircleSettingsCard.tsx';

export function CircleEditor({
	data,
	onReload,
}: AdminPageProps): React.ReactElement {
	const { messages } = useAdminLanguage();
	const selectedAdminPlayerId = getSelectedAdminPlayerId(data);
	const selectedUser = findRegisteredUser(data, selectedAdminPlayerId);
	const firstUserId = data.state.registeredUsers[0]?.playerId ?? '';
	const { isSubmitting, submitForm, error } = useAdminFormMutation(onReload);

	return (
		<>
			<PageHeader title={messages.pages.circle} onReload={onReload} />
			<AdminFormStatus error={error} />
			<CircleSettingsCard
				circle={data.state.circle}
				users={data.state.registeredUsers}
				selectedPlayerId={selectedUser?.playerId ?? ''}
				isSubmitting={isSubmitting}
				submitForm={submitForm}
			/>
			<CircleMembers
				circle={data.state.circle}
				users={data.state.registeredUsers}
				initialPlayerId={firstUserId}
				isSubmitting={isSubmitting}
				submitForm={submitForm}
			/>
			<CircleJoinRequests
				circle={data.state.circle}
				users={data.state.registeredUsers}
				initialPlayerId={firstUserId}
				isSubmitting={isSubmitting}
				submitForm={submitForm}
			/>
			<CircleChatLogs chatLogs={data.state.circle?.chatLogs ?? []} />
		</>
	);
}
