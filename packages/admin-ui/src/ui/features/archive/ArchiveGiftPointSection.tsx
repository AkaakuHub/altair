import EditIcon from '@mui/icons-material/Edit';
import { Box, Button, Grid } from '@mui/material';
import type { AdminTargetSelectionControl } from '../../../hooks/useAdminTargetSelection.ts';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { AdminSectionCard } from '../../components/AdminSectionCard.tsx';
import { AdminTargetSelect } from '../../components/AdminTargetSelect.tsx';
import { DataTable } from '../../components/DataTable.tsx';
import { NumericInput } from '../../components/NumericInput.tsx';
import { SaveButton } from '../../components/SaveButton.tsx';
import type {
	ArchiveGiftPoint,
	ArchiveGiftPointForm,
} from '../archive-prize-state.ts';

type ArchiveGiftPointSectionProps = {
	form: ArchiveGiftPointForm;
	rows: ArchiveGiftPoint[];
	isSubmitting: boolean;
	canSubmit: boolean;
	selection: AdminTargetSelectionControl;
	onFormChange: (form: ArchiveGiftPointForm) => void;
	onSubmit: () => void;
};

export function ArchiveGiftPointSection({
	form,
	rows,
	isSubmitting,
	canSubmit,
	selection,
	onFormChange,
	onSubmit,
}: ArchiveGiftPointSectionProps): React.ReactElement {
	const { messages } = useAdminLanguage();
	return (
		<>
			<AdminSectionCard title={messages.archive.giftPoints}>
				<Box
					component="form"
					onSubmit={(event) => {
						event.preventDefault();
						if (!isSubmitting && canSubmit) onSubmit();
					}}
				>
					<Grid container spacing={2}>
						<Grid size={{ xs: 12, md: 4 }}>
							<AdminTargetSelect
								label={messages.archive.liveId}
								selection={selection}
								disabled={isSubmitting}
								required
							/>
						</Grid>
						<Grid size={{ xs: 12, md: 2 }}>
							<NumericInput
								label={messages.archive.totalPoint}
								value={form.totalUserGiftPoint}
								min={0}
								disabled={isSubmitting || selection.hasPendingSelection}
								step={1}
								onValueChange={(totalUserGiftPoint) =>
									onFormChange({ ...form, totalUserGiftPoint })
								}
							/>
						</Grid>
						<Grid size={{ xs: 12, md: 2 }}>
							<NumericInput
								label={messages.archive.realtimePoint}
								value={form.totalUserGiftPointWithoutArchive}
								min={0}
								disabled={isSubmitting || selection.hasPendingSelection}
								step={1}
								onValueChange={(totalUserGiftPointWithoutArchive) =>
									onFormChange({
										...form,
										totalUserGiftPointWithoutArchive,
									})
								}
							/>
						</Grid>
						<Grid size={{ xs: 12, md: 2 }}>
							<SaveButton
								fullWidth
								type="submit"
								loading={isSubmitting}
								disabled={isSubmitting || !canSubmit}
							/>
						</Grid>
					</Grid>
				</Box>
			</AdminSectionCard>
			<DataTable<ArchiveGiftPoint>
				rows={rows}
				emptyText={messages.archive.noGiftPoints}
				getRowKey={(row) => `${row.playerId}:${row.liveId}`}
				columns={[
					{
						key: 'liveId',
						label: messages.archive.liveId,
						render: (row) => row.liveId,
					},
					{
						key: 'total',
						label: messages.archive.totalPoint,
						render: (row) => row.totalUserGiftPoint,
					},
					{
						key: 'realtime',
						label: messages.archive.realtimePoint,
						render: (row) => row.totalUserGiftPointWithoutArchive,
					},
					{
						key: 'earned',
						label: messages.archive.earnedStars,
						render: (row) => row.awardedArchivePrizeStarCount,
					},
					{
						key: 'assigned',
						label: messages.archive.assignedStars,
						render: (row) => row.allocatedArchivePrizeStarCount,
					},
					{
						key: 'edit',
						label: messages.action,
						render: (row) => (
							<Button
								size="small"
								variant="outlined"
								startIcon={<EditIcon />}
								disabled={isSubmitting}
								onClick={() => selection.select(row.liveId)}
							>
								{messages.edit}
							</Button>
						),
					},
				]}
			/>
		</>
	);
}
