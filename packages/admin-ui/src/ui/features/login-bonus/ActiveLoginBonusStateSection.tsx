import type { LoginBonusSummary } from '@altair/runtime/admin/dto/admin-seed-schema.ts';
import type { AdminLoginBonusProgress } from '@altair/runtime/admin/dto/admin-visible-state-schema.ts';
import { useCallback } from 'react';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { SearchableSelectablePaginatedDataTable } from '../../components/SearchableSelectablePaginatedDataTable.tsx';
import {
	filterLoginBonusesByQuery,
	findLoginBonusProgress,
} from './login-bonus-model.ts';

export function ActiveLoginBonusStateSection({
	rows,
	disabled,
	progresses,
	selectedLoginBonusId,
	onSelect,
}: {
	rows: LoginBonusSummary[];
	disabled: boolean;
	progresses: AdminLoginBonusProgress[];
	selectedLoginBonusId: number;
	onSelect: (row: LoginBonusSummary) => void;
}): React.ReactElement {
	const { messages } = useAdminLanguage();
	const filterRows = useCallback(
		(bonuses: LoginBonusSummary[], query: string) =>
			filterLoginBonusesByQuery(bonuses, query),
		[],
	);
	return (
		<SearchableSelectablePaginatedDataTable<LoginBonusSummary>
			disabled={disabled}
			title={messages.loginBonus.activeState}
			rows={rows}
			emptyText={messages.loginBonus.noActiveBonus}
			getRowKey={(row) => String(row.loginBonusId)}
			searchLabel={messages.search}
			filterRows={filterRows}
			selectedRowKey={
				selectedLoginBonusId > 0 ? String(selectedLoginBonusId) : undefined
			}
			onSelect={onSelect}
			columns={[
				{ key: 'id', label: messages.id, render: (row) => row.loginBonusId },
				{
					key: 'kind',
					label: messages.type,
					render: (row) => row.loginBonusKind,
				},
				{ key: 'name', label: messages.name, render: (row) => row.name },
				{
					key: 'days',
					label: messages.loginBonus.days,
					render: (row) => row.dayCount,
				},
				{
					key: 'received',
					label: messages.received,
					render: (row) =>
						findLoginBonusProgress(progresses, row.loginBonusId)
							?.receivedCount ?? 0,
				},
				{
					key: 'today',
					label: messages.loginBonus.receivedToday,
					render: (row) =>
						(findLoginBonusProgress(progresses, row.loginBonusId)
							?.isReceivedToday ?? false)
							? messages.yes
							: messages.no,
				},
			]}
		/>
	);
}
