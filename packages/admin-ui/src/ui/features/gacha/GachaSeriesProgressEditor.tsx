import { MAX_ADMIN_ITEM_QUANTITY } from '@altair/runtime/admin/domain/admin-limits.ts';
import type { GachaSeriesSummary } from '@altair/runtime/admin/dto/admin-seed-schema.ts';
import { Box, Grid } from '@mui/material';
import type { AdminFormValues } from '../../../form-value.ts';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { AdminSectionCard } from '../../components/AdminSectionCard.tsx';
import { NumericInput } from '../../components/NumericInput.tsx';
import { SaveButton } from '../../components/SaveButton.tsx';
import { GachaSeriesSelect } from './GachaSeriesSelect.tsx';
import {
	type findActiveGacha,
	getSeriesProgressForm,
	type SeriesProgressForm,
} from './gacha-page-model.ts';

type Props = {
	activeSeriesList: GachaSeriesSummary[];
	seriesForm: SeriesProgressForm;
	setSeriesForm(form: SeriesProgressForm): void;
	activeGacha: ReturnType<typeof findActiveGacha>;
	isMutationDisabled: boolean;
	isSubmitting: boolean;
	submit(path: string, values: AdminFormValues): Promise<void>;
};

export function GachaSeriesProgressEditor({
	activeSeriesList,
	seriesForm,
	setSeriesForm,
	activeGacha,
	isMutationDisabled,
	isSubmitting,
	submit,
}: Props): React.ReactElement {
	const { messages } = useAdminLanguage();
	return (
		<Grid size={{ xs: 12, lg: 6 }}>
			<AdminSectionCard title={messages.gacha.seriesProgress} sx={{ mb: 0 }}>
				<Box
					component="form"
					onSubmit={(event) => {
						event.preventDefault();
						void submit('/admin/gacha/series', {
							...seriesForm,
							userExchangePointNum: Number(seriesForm.userExchangePointNum),
							userSeriesExecCount: Number(seriesForm.userSeriesExecCount),
						});
					}}
				>
					<Grid container spacing={2}>
						<Grid size={{ xs: 12 }}>
							<GachaSeriesSelect
								seriesList={activeSeriesList}
								value={seriesForm.gachaSeriesId}
								disabled={isSubmitting}
								onChange={(gachaSeriesId) =>
									setSeriesForm(
										getSeriesProgressForm(activeGacha, gachaSeriesId),
									)
								}
							/>
						</Grid>
						<Grid size={{ xs: 12, md: 6 }}>
							<NumericInput
								label={messages.gacha.exchangePoint}
								value={seriesForm.userExchangePointNum}
								min={0}
								max={MAX_ADMIN_ITEM_QUANTITY}
								step={1}
								disabled={isSubmitting}
								onValueChange={(userExchangePointNum) =>
									setSeriesForm({ ...seriesForm, userExchangePointNum })
								}
							/>
						</Grid>
						<Grid size={{ xs: 12, md: 6 }}>
							<NumericInput
								label={messages.gacha.seriesExecCount}
								value={seriesForm.userSeriesExecCount}
								min={0}
								max={MAX_ADMIN_ITEM_QUANTITY}
								step={1}
								disabled={isSubmitting}
								onValueChange={(userSeriesExecCount) =>
									setSeriesForm({ ...seriesForm, userSeriesExecCount })
								}
							/>
						</Grid>
						<Grid size={{ xs: 12 }}>
							<SaveButton
								loading={isSubmitting}
								label={messages.gacha.saveProgress}
								type="submit"
								disabled={isMutationDisabled || seriesForm.gachaSeriesId <= 0}
							/>
						</Grid>
					</Grid>
				</Box>
			</AdminSectionCard>
		</Grid>
	);
}
