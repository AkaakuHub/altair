import type { GachaSeriesSummary } from '@altair/runtime/admin/dto/admin-seed-schema.ts';
import DeleteIcon from '@mui/icons-material/Delete';
import { Button, Grid, Stack } from '@mui/material';
import type { AdminFormValues } from '../../../form-value.ts';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { AdminSectionCard } from '../../components/AdminSectionCard.tsx';
import { DataTable } from '../../components/DataTable.tsx';
import { SaveButton } from '../../components/SaveButton.tsx';
import { SearchablePaginatedDataTable } from '../../components/SearchablePaginatedDataTable.tsx';
import { GachaSeriesSelect } from './GachaSeriesSelect.tsx';
import {
	createPurchasePlanValues,
	type findActiveGacha,
	findPurchasePlan,
	type PurchasePlanForm,
} from './gacha-page-model.ts';
import {
	addPurchasePlanCard,
	createPurchasePlanSelectedCards,
	filterPurchasePlanCardOptions,
	removePurchasePlanCard,
} from './gacha-purchase-plan-form-model.ts';
import type { PurchasePlanCardOption } from './gacha-series-view.ts';

type PurchasePlanEditorModel = {
	activeSeriesList: GachaSeriesSummary[];
	purchasePlanForm: PurchasePlanForm;
	setPurchasePlanForm(form: PurchasePlanForm): void;
	activeGacha: ReturnType<typeof findActiveGacha>;
	purchasePlanCardOptions: PurchasePlanCardOption[];
	isMutationDisabled: boolean;
	isSubmitting: boolean;
	submit(path: string, values: AdminFormValues): Promise<void>;
};

export function GachaPurchasePlanEditor({
	model,
}: {
	model: PurchasePlanEditorModel;
}): React.ReactElement {
	const { messages } = useAdminLanguage();
	const {
		activeSeriesList,
		purchasePlanForm,
		setPurchasePlanForm,
		activeGacha,
		purchasePlanCardOptions,
		isMutationDisabled,
		isSubmitting,
		submit,
	} = model;
	return (
		<Grid size={{ xs: 12, lg: 6 }}>
			<AdminSectionCard title={messages.gacha.purchasePlan}>
				<Stack spacing={2}>
					<GachaSeriesSelect
						seriesList={activeSeriesList}
						disabled={isSubmitting}
						value={purchasePlanForm.gachaSeriesId}
						onChange={(gachaSeriesId) =>
							setPurchasePlanForm({
								gachaSeriesId,
								cardDatasIds:
									findPurchasePlan(activeGacha, gachaSeriesId)?.cardDatasIds ??
									[],
							})
						}
					/>
					<DataTable
						rows={createPurchasePlanSelectedCards(
							purchasePlanForm.cardDatasIds,
							purchasePlanCardOptions,
						)}
						emptyText={messages.gacha.noPurchasePlanCards}
						getRowKey={(row) => String(row.order)}
						columns={[
							{
								key: 'order',
								label: messages.gacha.result,
								render: (row) => row.order,
							},
							{
								key: 'remove',
								label: messages.action,
								render: (row) => (
									<Button
										size="small"
										color="error"
										disabled={isSubmitting}
										onClick={() =>
											setPurchasePlanForm(
												removePurchasePlanCard(purchasePlanForm, row.order - 1),
											)
										}
									>
										{messages.remove}
									</Button>
								),
							},
							{
								key: 'id',
								label: messages.id,
								render: (row) => row.cardDatasId,
							},
							{
								key: 'name',
								label: messages.name,
								render: (row) => row.cardName,
							},
							{
								key: 'character',
								label: messages.character,
								render: (row) => row.characterId,
							},
						]}
					/>
					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
						<SaveButton
							label={messages.gacha.savePlan}
							loading={isSubmitting}
							disabled={
								isMutationDisabled ||
								purchasePlanForm.gachaSeriesId <= 0 ||
								purchasePlanForm.cardDatasIds.length === 0
							}
							onClick={() =>
								void submit(
									'/admin/gacha/purchase-plan',
									createPurchasePlanValues(purchasePlanForm),
								)
							}
						/>
						<Button
							variant="outlined"
							color="error"
							startIcon={<DeleteIcon />}
							disabled={
								isMutationDisabled || purchasePlanForm.gachaSeriesId <= 0
							}
							onClick={() =>
								void submit('/admin/gacha/purchase-plan/delete', {
									gachaSeriesId: purchasePlanForm.gachaSeriesId,
								})
							}
						>
							{messages.gacha.deletePlan}
						</Button>
					</Stack>
				</Stack>
			</AdminSectionCard>
			<SearchablePaginatedDataTable<PurchasePlanCardOption>
				key={purchasePlanForm.gachaSeriesId}
				title={messages.gacha.availableCards}
				rows={purchasePlanCardOptions}
				emptyText={messages.gacha.noPurchasePlanCards}
				getRowKey={(row) => String(row.cardDatasId)}
				searchLabel={messages.gacha.searchCards}
				filterRows={filterPurchasePlanCardOptions}
				columns={[
					{
						key: 'use',
						label: messages.action,
						render: (row) => (
							<Button
								size="small"
								disabled={
									isSubmitting || purchasePlanForm.cardDatasIds.length >= 10
								}
								onClick={() =>
									setPurchasePlanForm(
										addPurchasePlanCard(purchasePlanForm, row.cardDatasId),
									)
								}
							>
								{messages.use}
							</Button>
						),
					},
					{ key: 'id', label: messages.id, render: (row) => row.cardDatasId },
					{ key: 'name', label: messages.name, render: (row) => row.cardName },
					{
						key: 'character',
						label: messages.character,
						render: (row) => row.characterId,
					},
				]}
			/>
		</Grid>
	);
}
