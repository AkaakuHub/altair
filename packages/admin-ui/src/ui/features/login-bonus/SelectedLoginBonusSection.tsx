import type { LoginBonusSummary } from '@altair/runtime/admin/dto/admin-seed-schema.ts';
import { Typography } from '@mui/material';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { AdminSectionCard } from '../../components/AdminSectionCard.tsx';
import { DataTable } from '../../components/DataTable.tsx';

export function SelectedLoginBonusSection({
	loginBonus,
	receivedCount,
}: {
	loginBonus: LoginBonusSummary;
	receivedCount: number | null;
}): React.ReactElement {
	const { messages } = useAdminLanguage();
	return (
		<AdminSectionCard title={messages.loginBonus.selectedBonus}>
			<Typography variant="body2" sx={{ mb: 2 }}>
				{loginBonus.loginBonusId} {loginBonus.name} /{' '}
				{messages.loginBonus.progressSummary(
					String(receivedCount ?? '—'),
					loginBonus.dayCount,
				)}
			</Typography>
			<DataTable
				rows={loginBonus.rewards}
				emptyText={messages.loginBonus.noReward}
				getRowKey={(row) =>
					`${loginBonus.loginBonusId}-${row.dayCount}-${row.rewardType}-${row.rewardId}`
				}
				columns={[
					{
						key: 'day',
						label: messages.loginBonus.day,
						render: (row) => row.dayCount,
					},
					{
						key: 'status',
						label: messages.status,
						render: (row) =>
							receivedCount === null
								? '—'
								: row.dayCount <= receivedCount
									? messages.received
									: messages.loginBonus.pending,
					},
					{
						key: 'type',
						label: messages.loginBonus.rewardType,
						render: (row) => row.rewardType,
					},
					{
						key: 'id',
						label: messages.loginBonus.rewardId,
						render: (row) => row.rewardId,
					},
					{
						key: 'amount',
						label: messages.quantity,
						render: (row) => row.amount,
					},
					{ key: 'name', label: messages.name, render: (row) => row.name },
				]}
			/>
		</AdminSectionCard>
	);
}
