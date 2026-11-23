import { useAdminFormMutation } from '../../hooks/useAdminFormMutation.ts';
import { useAdminLanguage } from '../../i18n/AdminLanguageProvider.tsx';
import { AdminFormStatus } from '../components/AdminFormStatus.tsx';
import { PageHeader } from '../components/PageHeader.tsx';
import { AccountLinkFormCard } from '../features/users/AccountLinkFormCard.tsx';
import { EditUserFormCard } from '../features/users/EditUserFormCard.tsx';
import { NewUserFormCard } from '../features/users/NewUserFormCard.tsx';
import { RegisteredUserList } from '../features/users/RegisteredUserList.tsx';
import type { AdminPageProps } from '../page-props.ts';

export function UsersPage({
	data,
	onReload,
}: AdminPageProps): React.ReactElement {
	const { messages } = useAdminLanguage();
	const { error, isSubmitting, submitForm } = useAdminFormMutation(onReload);
	return (
		<>
			<PageHeader title={messages.pages.users} onReload={onReload} />
			<AdminFormStatus error={error} />
			<NewUserFormCard isSubmitting={isSubmitting} submitForm={submitForm} />
			<EditUserFormCard
				data={data}
				isSubmitting={isSubmitting}
				submitForm={submitForm}
			/>
			<AccountLinkFormCard
				data={data}
				isSubmitting={isSubmitting}
				submitForm={submitForm}
			/>
			<RegisteredUserList users={data.state.registeredUsers} />
		</>
	);
}
