import type { AdminCircle } from '@altair/runtime/admin/dto/admin-visible-state-schema.ts';
import { Box } from '@mui/material';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { SearchablePaginatedDataTable } from '../../components/SearchablePaginatedDataTable.tsx';
import { filterChatLogs } from './circle-model.ts';

type CircleChatLog = NonNullable<AdminCircle>['chatLogs'][number];

export function CircleChatLogs({
	chatLogs,
}: {
	chatLogs: CircleChatLog[];
}): React.ReactElement {
	const { messages } = useAdminLanguage();
	return (
		<Box sx={{ mt: 3 }}>
			<SearchablePaginatedDataTable<CircleChatLog>
				title={messages.circle.chatLogs}
				rows={chatLogs}
				emptyText={messages.circle.noChatLogs}
				getRowKey={(row) => `${row.orderId}:${row.chatDataId}:${row.comment}`}
				searchLabel={messages.circle.searchChatLogs}
				filterRows={filterChatLogs}
				columns={[
					{
						key: 'order',
						label: messages.circle.order,
						render: (row) => row.orderId,
					},
					{ key: 'type', label: messages.type, render: (row) => row.chatType },
					{
						key: 'player',
						label: messages.circle.playerId,
						render: (row) => row.playerId,
					},
					{
						key: 'comment',
						label: messages.comment,
						render: (row) => row.comment,
					},
					{
						key: 'time',
						label: messages.created,
						render: (row) => row.createTime ?? '',
					},
				]}
			/>
		</Box>
	);
}
