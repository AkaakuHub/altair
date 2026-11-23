import type {
	GachaSeriesSummary,
	SelectTicketSeriesSummary,
} from '@altair/runtime/admin/dto/admin-seed-schema.ts';
import { Box, Switch } from '@mui/material';
import { useCallback, useMemo } from 'react';
import { useAdminActivationDraft } from '../../../hooks/useAdminActivationDraft.ts';
import { useAdminFormMutation } from '../../../hooks/useAdminFormMutation.ts';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { AdminFormStatus } from '../../components/AdminFormStatus.tsx';
import { PageHeader } from '../../components/PageHeader.tsx';
import { SaveButton } from '../../components/SaveButton.tsx';
import { SearchableActiveOnlyPaginatedDataTable } from '../../components/SearchableActiveOnlyPaginatedDataTable.tsx';
import type { AdminPageProps } from '../../page-props.ts';
import {
	createGachaActivationForm,
	createSelectTicketActivationForm,
	filterGachaSeries,
	filterSelectTicketSeries,
	getChangedGachaActivations,
	getChangedSelectTicketActivations,
} from './gacha-activation-form-model.ts';

export function ServerGachaPage({
	data,
	onReload,
}: AdminPageProps): React.ReactElement {
	const { messages } = useAdminLanguage();
	const activationSource = useMemo(
		() => createGachaActivationForm(data.state.gachaSeriesActivations),
		[data.state.gachaSeriesActivations],
	);
	const selectTicketSource = useMemo(
		() =>
			createSelectTicketActivationForm(
				data.state.selectTicketSeriesActivations,
			),
		[data.state.selectTicketSeriesActivations],
	);
	const { value: activationForm, setEnabled: setActivationEnabled } =
		useAdminActivationDraft(activationSource);
	const {
		value: selectTicketActivationForm,
		setEnabled: setSelectTicketEnabled,
	} = useAdminActivationDraft(selectTicketSource);
	const { isSubmitting, error, submitForm } = useAdminFormMutation(onReload);
	const changedActivations = getChangedGachaActivations(
		data.seed.gachaSeries,
		data.state.gachaSeriesActivations,
		activationForm,
	);
	const changedSelectTicketActivations = getChangedSelectTicketActivations(
		data.seed.selectTicketSeries,
		data.state.selectTicketSeriesActivations,
		selectTicketActivationForm,
	);
	const filterSeriesRows = useCallback(
		(rows: GachaSeriesSummary[], query: string, activeOnly: boolean) =>
			filterGachaSeries(rows, activationForm, query, activeOnly),
		[activationForm],
	);
	const filterSelectTicketRows = useCallback(
		(rows: SelectTicketSeriesSummary[], query: string, activeOnly: boolean) =>
			filterSelectTicketSeries(
				rows,
				selectTicketActivationForm,
				query,
				activeOnly,
			),
		[selectTicketActivationForm],
	);
	async function saveActivations(): Promise<void> {
		await submitForm('/admin/gacha-activations', {
			activations: JSON.stringify(changedActivations),
		});
	}
	async function saveSelectTicketActivations(): Promise<void> {
		await submitForm('/admin/gacha/select-ticket-activations', {
			activations: JSON.stringify(changedSelectTicketActivations),
		});
	}

	return (
		<>
			<PageHeader title={messages.pages['gacha-server']} onReload={onReload} />
			<AdminFormStatus error={error} />
			<SearchableActiveOnlyPaginatedDataTable<GachaSeriesSummary>
				title={messages.gacha.series}
				rows={data.seed.gachaSeries}
				emptyText={messages.gacha.noSeries}
				getRowKey={(row) => String(row.gachaSeriesId)}
				searchLabel={messages.search}
				filterRows={filterSeriesRows}
				columns={[
					{
						key: 'id',
						label: messages.gacha.seriesId,
						render: (row) => row.gachaSeriesId,
					},
					{ key: 'title', label: messages.title, render: (row) => row.title },
					{ key: 'type', label: messages.type, render: (row) => row.gachaType },
					{
						key: 'party',
						label: messages.gacha.party,
						render: (row) => (row.isPartyGacha ? messages.yes : messages.no),
					},
					{
						key: 'cards',
						label: messages.gacha.webViewCards,
						render: (row) => row.cardCount,
					},
					{
						key: 'exchange',
						label: messages.gacha.exchangeTargets,
						render: (row) => row.guaranteeExchangeRateCount,
					},
					{
						key: 'current',
						label: messages.gacha.current,
						render: (row) => (row.isCurrentlyOpen ? messages.yes : messages.no),
					},
					{
						key: 'start',
						label: messages.startTime,
						render: (row) => row.startTime,
					},
					{
						key: 'end',
						label: messages.endTime,
						render: (row) => row.endTime,
					},
					{
						key: 'enabled',
						label: messages.active,
						render: (row) => (
							<Switch
								checked={activationForm[row.gachaSeriesId] ?? false}
								disabled={isSubmitting}
								slotProps={{
									input: {
										'aria-label': messages.activationLabel(
											row.title,
											row.gachaSeriesId,
										),
									},
								}}
								onChange={(event) =>
									setActivationEnabled(row.gachaSeriesId, event.target.checked)
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
					disabled={isSubmitting || changedActivations.length === 0}
					onClick={() => void saveActivations()}
				/>
			</Box>
			<Box sx={{ mt: 4 }}>
				<SearchableActiveOnlyPaginatedDataTable<SelectTicketSeriesSummary>
					title={messages.gacha.selectTicketSeries}
					rows={data.seed.selectTicketSeries}
					emptyText={messages.gacha.noSelectTicketSeries}
					getRowKey={(row) => String(row.selectTicketSeriesId)}
					searchLabel={messages.search}
					filterRows={filterSelectTicketRows}
					columns={[
						{
							key: 'id',
							label: messages.gacha.selectTicketSeriesId,
							render: (row) => row.selectTicketSeriesId,
						},
						{
							key: 'ticket',
							label: messages.gacha.exchangeTicketId,
							render: (row) => row.exchangeTicketId,
						},
						{
							key: 'start',
							label: messages.startTime,
							render: (row) => row.startTime,
						},
						{
							key: 'end',
							label: messages.endTime,
							render: (row) => row.endTime,
						},
						{
							key: 'enabled',
							label: messages.active,
							render: (row) => (
								<Switch
									checked={
										selectTicketActivationForm[row.selectTicketSeriesId] ??
										false
									}
									disabled={isSubmitting}
									slotProps={{
										input: {
											'aria-label': messages.gacha.selectTicketActivationLabel(
												row.selectTicketSeriesId,
											),
										},
									}}
									onChange={(event) =>
										setSelectTicketEnabled(
											row.selectTicketSeriesId,
											event.target.checked,
										)
									}
								/>
							),
						},
					]}
				/>
			</Box>
			<Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
				<SaveButton
					loading={isSubmitting}
					label={messages.gacha.saveSelectTicketActivations}
					disabled={isSubmitting || changedSelectTicketActivations.length === 0}
					onClick={() => void saveSelectTicketActivations()}
				/>
			</Box>
		</>
	);
}
