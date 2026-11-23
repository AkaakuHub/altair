import type { GachaSeriesSummary } from '@altair/runtime/admin/dto/admin-seed-schema.ts';
import { Grid } from '@mui/material';
import { useCallback, useMemo } from 'react';
import type { AdminFormValues } from '../../form-value.ts';
import { useAdminFormMutation } from '../../hooks/useAdminFormMutation.ts';
import { useAdminLanguage } from '../../i18n/AdminLanguageProvider.tsx';
import { AdminFormStatus } from '../components/AdminFormStatus.tsx';
import { PageHeader } from '../components/PageHeader.tsx';
import { SearchableSelectablePaginatedDataTable } from '../components/SearchableSelectablePaginatedDataTable.tsx';
import {
	GachaGuaranteeEditor,
	GachaGuaranteeTable,
} from '../features/gacha/GachaGuaranteeEditor.tsx';
import { GachaPurchasePlanEditor } from '../features/gacha/GachaPurchasePlanEditor.tsx';
import { GachaSeriesProgressEditor } from '../features/gacha/GachaSeriesProgressEditor.tsx';
import {
	createGuaranteeForm,
	createPurchasePlanForm,
	findActiveGacha,
	getSeriesProgressForm,
} from '../features/gacha/gacha-page-model.ts';
import {
	activeGachaSeriesList,
	createGuaranteeExchangeRows,
	createPurchasePlanCardOptions,
	filterGachaSeriesByQuery,
} from '../features/gacha/gacha-series-view.ts';
import { useGachaDrafts } from '../features/gacha/useGachaDrafts.ts';
import { getSelectedAdminPlayerId } from '../features/player-state.ts';
import type { AdminPageProps } from '../page-props.ts';

export function UserGachaPage({
	data,
	onReload,
}: AdminPageProps): React.ReactElement {
	const { messages } = useAdminLanguage();
	const activeSeriesList = useMemo(
		() =>
			activeGachaSeriesList(
				data.seed.gachaSeries,
				data.state.gachaSeriesActivations,
			),
		[data.seed.gachaSeries, data.state.gachaSeriesActivations],
	);
	const selectedAdminPlayerId = getSelectedAdminPlayerId(data);
	const activeGacha = useMemo(
		() => findActiveGacha(data, selectedAdminPlayerId),
		[data, selectedAdminPlayerId],
	);
	const drafts = useGachaDrafts(activeGacha, activeSeriesList);
	const seriesForm = drafts.series.value;
	const setSeriesForm = drafts.series.setValue;
	const guaranteeForm = drafts.guarantee.value;
	const setGuaranteeForm = drafts.guarantee.setValue;
	const purchasePlanForm = drafts.purchasePlan.value;
	const setPurchasePlanForm = drafts.purchasePlan.setValue;
	const selectedSeries = activeSeriesList.find(
		(series) => series.gachaSeriesId === seriesForm.gachaSeriesId,
	);
	const selectedGuaranteeSeries = activeSeriesList.find(
		(series) => series.gachaSeriesId === guaranteeForm.gachaSeriesId,
	);
	const selectedPurchasePlanSeries = activeSeriesList.find(
		(series) => series.gachaSeriesId === purchasePlanForm.gachaSeriesId,
	);
	const guaranteeExchangeRows = createGuaranteeExchangeRows(
		selectedGuaranteeSeries,
		activeGacha,
	);
	const purchasePlanCardOptions = useMemo(
		() =>
			createPurchasePlanCardOptions(
				selectedPurchasePlanSeries,
				data.cardCatalog,
			),
		[selectedPurchasePlanSeries, data.cardCatalog],
	);
	const filterActiveSeriesRows = useCallback(
		(rows: GachaSeriesSummary[], query: string) =>
			filterGachaSeriesByQuery(rows, query),
		[],
	);
	const { isSubmitting, error, submitPlayerForm } =
		useAdminFormMutation(onReload);
	const isMutationDisabled = selectedAdminPlayerId.length === 0 || isSubmitting;

	async function submit(path: string, values: AdminFormValues): Promise<void> {
		let afterSubmit: (() => void) | undefined;
		switch (path) {
			case '/admin/gacha/series':
				afterSubmit = () => drafts.series.acceptSaved(seriesForm);
				break;
			case '/admin/gacha/guarantee':
				afterSubmit = () => drafts.guarantee.acceptSaved(guaranteeForm);
				break;
			case '/admin/gacha/purchase-plan':
				afterSubmit = () => drafts.purchasePlan.acceptSaved(purchasePlanForm);
				break;
			case '/admin/gacha/purchase-plan/delete':
				afterSubmit = () =>
					drafts.purchasePlan.acceptSaved({
						...purchasePlanForm,
						cardDatasIds: [],
					});
				break;
		}
		await submitPlayerForm(path, selectedAdminPlayerId, values, afterSubmit);
	}
	const draftSections = [
		{ label: messages.gacha.seriesProgress, draft: drafts.series },
		{ label: messages.gacha.guaranteeExchange, draft: drafts.guarantee },
		{ label: messages.gacha.purchasePlan, draft: drafts.purchasePlan },
	];
	const conflicts = draftSections.filter(({ draft }) => draft.conflicted);
	const unavailable = draftSections.filter(
		({ draft }) => !draft.isAvailable && draft.value.gachaSeriesId !== 0,
	);

	return (
		<>
			<PageHeader title={messages.pages.gacha} onReload={onReload} />
			<AdminFormStatus
				error={
					error ??
					(unavailable.length > 0
						? messages.gacha.unavailable(unavailable.map(({ label }) => label))
						: null)
				}
				conflicted={conflicts.length > 0}
				disabled={isSubmitting}
				onReset={() => {
					for (const { draft } of conflicts) draft.reset();
				}}
			/>
			<Grid container spacing={3} sx={{ mb: 3 }}>
				<GachaSeriesProgressEditor
					activeSeriesList={activeSeriesList}
					seriesForm={seriesForm}
					setSeriesForm={setSeriesForm}
					activeGacha={activeGacha}
					isMutationDisabled={isMutationDisabled || !drafts.series.isAvailable}
					isSubmitting={isSubmitting}
					submit={submit}
				/>
				<GachaGuaranteeEditor
					model={{
						activeSeriesList,
						guaranteeForm,
						setGuaranteeForm,
						activeGacha,
						isMutationDisabled:
							isMutationDisabled || !drafts.guarantee.isAvailable,
						isSubmitting,
						submit,
					}}
				/>
				<GachaPurchasePlanEditor
					model={{
						activeSeriesList,
						purchasePlanForm,
						setPurchasePlanForm,
						activeGacha,
						purchasePlanCardOptions,
						isMutationDisabled:
							isMutationDisabled || !drafts.purchasePlan.isAvailable,
						isSubmitting,
						submit,
					}}
				/>
			</Grid>
			<SearchableSelectablePaginatedDataTable<GachaSeriesSummary>
				disabled={isSubmitting}
				title={messages.gacha.activeSeries}
				rows={activeSeriesList}
				emptyText={messages.gacha.noSeries}
				getRowKey={(row) => String(row.gachaSeriesId)}
				searchLabel={messages.search}
				filterRows={filterActiveSeriesRows}
				selectedRowKey={
					selectedSeries === undefined
						? undefined
						: String(selectedSeries.gachaSeriesId)
				}
				onSelect={(row) => {
					if (isSubmitting) return;
					setSeriesForm(getSeriesProgressForm(activeGacha, row.gachaSeriesId));
					setGuaranteeForm(createGuaranteeForm(activeGacha, row));
					setPurchasePlanForm(
						createPurchasePlanForm(activeGacha, row.gachaSeriesId),
					);
				}}
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
						key: 'exchangeCards',
						label: messages.gacha.webViewCards,
						render: (row) => row.cardCount,
					},
					{
						key: 'exchangeTargets',
						label: messages.gacha.exchangeTargets,
						render: (row) => row.guaranteeExchangeRateCount,
					},
					{
						key: 'single',
						label: messages.gacha.single,
						render: (row) => (row.isSingleEnable ? messages.yes : messages.no),
					},
					{
						key: 'consecutive',
						label: messages.gacha.consecutive,
						render: (row) =>
							row.isConsectiveEnable ? messages.yes : messages.no,
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
				]}
			/>
			<GachaGuaranteeTable
				rows={guaranteeExchangeRows}
				disabled={isSubmitting}
				onEdit={setGuaranteeForm}
			/>
		</>
	);
}
