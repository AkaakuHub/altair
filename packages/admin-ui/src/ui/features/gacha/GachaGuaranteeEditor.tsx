import { MAX_ADMIN_ITEM_QUANTITY } from '@altair/runtime/admin/domain/admin-limits.ts';
import type { GachaSeriesSummary } from '@altair/runtime/admin/dto/admin-seed-schema.ts';
import {
	Box,
	Button,
	FormControlLabel,
	Grid,
	Switch,
	TextField,
} from '@mui/material';
import type { AdminFormValues } from '../../../form-value.ts';
import { useAdminUnsavedChangesContext } from '../../../hooks/useAdminUnsavedChanges.ts';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { AdminSectionCard } from '../../components/AdminSectionCard.tsx';
import { DataTable } from '../../components/DataTable.tsx';
import { NumericInput } from '../../components/NumericInput.tsx';
import { SaveButton } from '../../components/SaveButton.tsx';
import { GachaSeriesSelect } from './GachaSeriesSelect.tsx';
import {
	createGuaranteeForm,
	type findActiveGacha,
	type GuaranteeForm,
} from './gacha-page-model.ts';
import {
	createGuaranteeFormFromRow,
	type GuaranteeExchangeRow,
} from './gacha-series-view.ts';

type GuaranteeEditorModel = {
	activeSeriesList: GachaSeriesSummary[];
	guaranteeForm: GuaranteeForm;
	setGuaranteeForm: (form: GuaranteeForm) => void;
	activeGacha: ReturnType<typeof findActiveGacha>;
	isMutationDisabled: boolean;
	isSubmitting: boolean;
	submit: (path: string, values: AdminFormValues) => Promise<void>;
};

export function GachaGuaranteeEditor({
	model,
}: {
	model: GuaranteeEditorModel;
}): React.ReactElement {
	const { messages } = useAdminLanguage();
	const {
		activeSeriesList,
		guaranteeForm,
		setGuaranteeForm,
		activeGacha,
		isMutationDisabled,
		isSubmitting,
		submit,
	} = model;
	return (
		<Grid size={{ xs: 12, lg: 6 }}>
			<AdminSectionCard title={messages.gacha.guaranteeExchange} sx={{ mb: 0 }}>
				<Box
					component="form"
					onSubmit={(event) => {
						event.preventDefault();
						void submit('/admin/gacha/guarantee', {
							...guaranteeForm,
							remainingExchangeNum: Number(guaranteeForm.remainingExchangeNum),
						});
					}}
				>
					<Grid container spacing={2}>
						<Grid size={{ xs: 12, md: 6 }}>
							<GachaSeriesSelect
								seriesList={activeSeriesList}
								disabled={isSubmitting}
								value={guaranteeForm.gachaSeriesId}
								onChange={(gachaSeriesId) => {
									const nextSeries = activeSeriesList.find(
										(series) => series.gachaSeriesId === gachaSeriesId,
									);
									setGuaranteeForm(
										createGuaranteeForm(activeGacha, nextSeries),
									);
								}}
							/>
						</Grid>
						<Grid size={{ xs: 12, md: 6 }}>
							<TextField
								fullWidth
								disabled
								size="small"
								label={messages.gacha.exchangePointRateId}
								value={String(guaranteeForm.exchangePointRateId)}
							/>
						</Grid>
						<Grid size={{ xs: 12, md: 6 }}>
							<NumericInput
								label={messages.gacha.remainingExchange}
								value={guaranteeForm.remainingExchangeNum}
								min={-1}
								max={MAX_ADMIN_ITEM_QUANTITY}
								step={1}
								disabled={isSubmitting}
								onValueChange={(remainingExchangeNum) =>
									setGuaranteeForm({
										...guaranteeForm,
										remainingExchangeNum,
									})
								}
							/>
						</Grid>
						<Grid size={{ xs: 12, md: 6 }}>
							<FormControlLabel
								control={
									<Switch
										checked={guaranteeForm.isHaving}
										disabled={isSubmitting}
										onChange={(event) =>
											setGuaranteeForm({
												...guaranteeForm,
												isHaving: event.target.checked,
											})
										}
									/>
								}
								label={messages.gacha.owned}
							/>
						</Grid>
						<Grid size={{ xs: 12 }}>
							<SaveButton
								loading={isSubmitting}
								label={messages.gacha.saveGuarantee}
								type="submit"
								disabled={
									isMutationDisabled ||
									guaranteeForm.gachaSeriesId <= 0 ||
									guaranteeForm.exchangePointRateId <= 0
								}
							/>
						</Grid>
					</Grid>
				</Box>
			</AdminSectionCard>
		</Grid>
	);
}

export function GachaGuaranteeTable({
	rows,
	onEdit,
	disabled,
}: {
	rows: GuaranteeExchangeRow[];
	onEdit: (form: GuaranteeForm) => void;
	disabled: boolean;
}): React.ReactElement {
	const { messages } = useAdminLanguage();
	const guaranteeExchangeRows = rows;
	const { requestAction } = useAdminUnsavedChangesContext();
	const setGuaranteeForm = onEdit;
	return (
		<Box sx={{ mt: 3 }}>
			<DataTable<GuaranteeExchangeRow>
				rows={guaranteeExchangeRows}
				emptyText={messages.gacha.noGuaranteeTarget}
				getRowKey={(row) => String(row.exchangePointRateId)}
				columns={[
					{
						key: 'rate',
						label: messages.gacha.exchangePointRateId,
						render: (row) => row.exchangePointRateId,
					},
					{
						key: 'item',
						label: messages.gacha.target,
						render: (row) =>
							`${row.exchangeItemType}:${row.exchangeItemId} x${row.exchangeItemQuantity}`,
					},
					{
						key: 'price',
						label: messages.gacha.price,
						render: (row) => row.exchangePrice,
					},
					{
						key: 'limit',
						label: messages.gacha.limit,
						render: (row) => row.limitedCount,
					},
					{
						key: 'having',
						label: messages.gacha.owned,
						render: (row) => (row.isHaving ? messages.yes : messages.no),
					},
					{
						key: 'remaining',
						label: messages.gacha.remaining,
						render: (row) => row.remainingExchangeNum,
					},
					{
						key: 'action',
						label: messages.action,
						render: (row) => (
							<Button
								size="small"
								disabled={disabled}
								onClick={() =>
									requestAction(() =>
										setGuaranteeForm(createGuaranteeFormFromRow(row)),
									)
								}
							>
								{messages.edit}
							</Button>
						),
					},
				]}
			/>
		</Box>
	);
}
