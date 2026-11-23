import type { LoginBonusSummary } from '@altair/runtime/admin/dto/admin-seed-schema.ts';
import { Box, Switch } from '@mui/material';
import { useCallback, useMemo } from 'react';
import { useAdminActivationDraft } from '../../../hooks/useAdminActivationDraft.ts';
import { useAdminFormMutation } from '../../../hooks/useAdminFormMutation.ts';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { AdminFormStatus } from '../../components/AdminFormStatus.tsx';
import { SaveButton } from '../../components/SaveButton.tsx';
import { SearchableActiveOnlyPaginatedDataTable } from '../../components/SearchableActiveOnlyPaginatedDataTable.tsx';
import type { AdminPageProps } from '../../page-props.ts';
import {
	createLoginBonusActivationForm,
	filterLoginBonuses,
	getChangedLoginBonusActivations,
} from './login-bonus-model.ts';

export function ServerLoginBonusEditor({
	data,
	onReload,
}: AdminPageProps): React.ReactElement {
	const { messages } = useAdminLanguage();
	const source = useMemo(
		() => createLoginBonusActivationForm(data.state.loginBonusActivations),
		[data.state.loginBonusActivations],
	);
	const { value: form, setEnabled } = useAdminActivationDraft(source);
	const { isSubmitting, error, submitForm } = useAdminFormMutation(onReload);
	const changes = getChangedLoginBonusActivations(
		data.seed.loginBonuses,
		data.state.loginBonusActivations,
		form,
	);
	const filterRows = useCallback(
		(rows: LoginBonusSummary[], query: string, activeOnly: boolean) =>
			filterLoginBonuses(rows, form, query, activeOnly),
		[form],
	);

	return (
		<>
			<AdminFormStatus error={error} />
			<SearchableActiveOnlyPaginatedDataTable<LoginBonusSummary>
				rows={data.seed.loginBonuses}
				emptyText={messages.loginBonus.noBonus}
				getRowKey={(row) => String(row.loginBonusId)}
				searchLabel={messages.search}
				filterRows={filterRows}
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
						key: 'start',
						label: messages.startTime,
						render: (row) => row.startTime,
					},
					{ key: 'end', label: messages.endTime, render: (row) => row.endTime },
					{
						key: 'enabled',
						label: messages.active,
						render: (row) => (
							<Switch
								checked={form[row.loginBonusId] ?? false}
								disabled={isSubmitting}
								slotProps={{
									input: {
										'aria-label': messages.activationLabel(
											row.name,
											row.loginBonusId,
										),
									},
								}}
								onChange={(event) =>
									setEnabled(row.loginBonusId, event.target.checked)
								}
							/>
						),
					},
				]}
			/>
			<Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
				<SaveButton
					loading={isSubmitting}
					label={messages.saveActivations}
					disabled={isSubmitting || changes.length === 0}
					onClick={() =>
						void submitForm('/admin/login-bonus-activations', {
							activations: JSON.stringify(changes),
						})
					}
				/>
			</Box>
		</>
	);
}
