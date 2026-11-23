import { Grid } from '@mui/material';
import { useAdminFormMutation } from '../../../hooks/useAdminFormMutation.ts';
import { AdminFormStatus } from '../../components/AdminFormStatus.tsx';
import type { AdminPageProps } from '../../page-props.ts';
import { findPlayerState, getSelectedAdminPlayerId } from '../player-state.ts';
import { ActivityRecordSeriesList } from './ActivityRecordSeriesList.tsx';
import { AdvWatchForm } from './AdvWatchForm.tsx';
import { MonthlyBadgeForm } from './MonthlyBadgeForm.tsx';

export function ActivityRecordEditor({
	data,
	onReload,
}: AdminPageProps): React.ReactElement {
	const playerId = getSelectedAdminPlayerId(data);
	const activityRecord = findPlayerState(
		data.state.userActivityRecords,
		playerId,
	);
	const disabled =
		playerId.length === 0 || data.seed.activityRecordSeries.length === 0;
	const { error, isSubmitting, submitPlayerForm } =
		useAdminFormMutation(onReload);
	return (
		<>
			<AdminFormStatus error={error} />
			<Grid container spacing={3} sx={{ mb: 3 }}>
				<Grid size={{ xs: 12, lg: 6 }}>
					<MonthlyBadgeForm
						seriesList={data.seed.activityRecordSeries}
						activityRecord={activityRecord}
						disabled={disabled || isSubmitting}
						isSubmitting={isSubmitting}
						onSave={(form, afterSaved) =>
							void submitPlayerForm(
								'/admin/activity-record/month',
								playerId,
								{
									advSeriesId: form.advSeriesId,
									isDisplayed: form.isDisplayed,
								},
								afterSaved,
							)
						}
					/>
				</Grid>
				<Grid size={{ xs: 12, lg: 6 }}>
					<AdvWatchForm
						seriesList={data.seed.activityRecordSeries}
						activityRecord={activityRecord}
						disabled={disabled || isSubmitting}
						isSubmitting={isSubmitting}
						onSave={(form, afterSaved) =>
							void submitPlayerForm(
								'/admin/activity-record/adv',
								playerId,
								{
									advDataId: form.advDataId,
									isWatched: form.isWatched,
								},
								afterSaved,
							)
						}
					/>
				</Grid>
			</Grid>
			<ActivityRecordSeriesList
				rows={data.seed.activityRecordSeries}
				activityRecord={activityRecord}
			/>
		</>
	);
}
