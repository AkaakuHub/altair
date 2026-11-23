import { useAdminLanguage } from '../../i18n/AdminLanguageProvider.tsx';
import { PageHeader } from '../components/PageHeader.tsx';
import { getSelectedAdminPlayerId } from '../features/player-state.ts';
import { UserStatusEditor } from '../features/user-status/UserStatusEditor.tsx';
import type { AdminPageProps } from '../page-props.ts';

export function UserStatusPage({
	data,
	onReload,
}: AdminPageProps): React.ReactElement {
	const { messages } = useAdminLanguage();
	return (
		<>
			<PageHeader title={messages.pages['user-status']} onReload={onReload} />
			<UserStatusEditor
				data={data}
				playerId={getSelectedAdminPlayerId(data)}
				onReload={onReload}
			/>
		</>
	);
}
