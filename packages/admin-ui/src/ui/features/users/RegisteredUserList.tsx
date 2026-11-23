import type { AdminRegisteredUser } from '@altair/runtime/admin/dto/admin-visible-state-schema.ts';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { SearchablePaginatedDataTable } from '../../components/SearchablePaginatedDataTable.tsx';
import { filterRegisteredUsers } from './user-model.ts';

export function RegisteredUserList({
	users,
}: {
	users: AdminRegisteredUser[];
}): React.ReactElement {
	const { messages } = useAdminLanguage();
	return (
		<SearchablePaginatedDataTable<AdminRegisteredUser>
			title={messages.users.registeredUsers}
			rows={users}
			emptyText={messages.users.noRegisteredUsers}
			getRowKey={(row) => row.playerId}
			searchLabel={messages.users.searchUsers}
			filterRows={filterRegisteredUsers}
			columns={[
				{
					key: 'id',
					label: messages.users.playerId,
					render: (row) => row.playerId,
				},
				{
					key: 'name',
					label: messages.name,
					render: (row) => row.playerName,
				},
				{
					key: 'level',
					label: messages.level,
					render: (row) => row.playerLevel,
				},
				{
					key: 'birthday',
					label: messages.users.birthday,
					render: (row) => row.birthday,
				},
				{
					key: 'device',
					label: messages.users.deviceId,
					render: (row) => row.deviceSpecificId,
				},
				{
					key: 'last',
					label: messages.users.lastLogin,
					render: (row) => row.lastLoginDate,
				},
			]}
		/>
	);
}
