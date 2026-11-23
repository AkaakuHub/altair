import { useAdminLanguage } from '../../i18n/AdminLanguageProvider.tsx';
import { PageHeader } from '../components/PageHeader.tsx';
import { ServerLoginBonusEditor } from '../features/login-bonus/ServerLoginBonusEditor.tsx';
import { UserLoginBonusEditor } from '../features/login-bonus/UserLoginBonusEditor.tsx';
import type { AdminPageProps } from '../page-props.ts';

export function ServerLoginBonusPage(
	props: AdminPageProps,
): React.ReactElement {
	const { messages } = useAdminLanguage();
	return (
		<>
			<PageHeader
				title={messages.pages['login-bonus-server']}
				onReload={props.onReload}
			/>
			<ServerLoginBonusEditor {...props} />
		</>
	);
}

export function UserLoginBonusPage(props: AdminPageProps): React.ReactElement {
	const { messages } = useAdminLanguage();
	return (
		<>
			<PageHeader
				title={messages.pages['login-bonus']}
				onReload={props.onReload}
			/>
			<UserLoginBonusEditor {...props} />
		</>
	);
}
