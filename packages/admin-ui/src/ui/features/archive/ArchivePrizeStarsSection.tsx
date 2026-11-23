import { Box, Button, Grid, TextField } from '@mui/material';
import { useAdminUnsavedChangesContext } from '../../../hooks/useAdminUnsavedChanges.ts';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { AdminSectionCard } from '../../components/AdminSectionCard.tsx';
import { DataTable } from '../../components/DataTable.tsx';
import { NumericInput } from '../../components/NumericInput.tsx';
import { SaveButton } from '../../components/SaveButton.tsx';
import {
	type ArchivePrizeCandidate,
	type ArchivePrizePresent,
	type ArchivePrizeStarForm,
	canApplyArchiveStars,
	emptyArchivePrizeStarForm,
	setArchivePrizeStarNum,
	sumSelectedStars,
} from '../archive-prize-state.ts';

type ArchivePrizeStarsSectionProps = {
	form: ArchivePrizeStarForm;
	presents: ArchivePrizePresent[];
	selectedPresent: ArchivePrizePresent | undefined;
	candidates: ArchivePrizeCandidate[];
	isSubmitting: boolean;
	canSubmit: boolean;
	onFormChange: (form: ArchivePrizeStarForm) => void;
	onSubmit: () => void;
};

export function ArchivePrizeStarsSection({
	form,
	presents,
	selectedPresent,
	candidates,
	isSubmitting,
	canSubmit,
	onFormChange,
	onSubmit,
}: ArchivePrizeStarsSectionProps): React.ReactElement {
	const { messages } = useAdminLanguage();
	const { requestAction } = useAdminUnsavedChangesContext();
	const selectedStarSum = sumSelectedStars(form);
	return (
		<AdminSectionCard title={messages.archive.prizeStars} sx={{ my: 3 }}>
			<Box
				component="form"
				onSubmit={(event) => {
					event.preventDefault();
					if (
						!isSubmitting &&
						canSubmit &&
						selectedPresent &&
						canApplyArchiveStars(form, selectedPresent.num)
					)
						onSubmit();
				}}
			>
				<Grid container spacing={2}>
					<Grid size={{ xs: 12 }}>
						<DataTable<ArchivePrizePresent>
							rows={presents}
							emptyText={messages.archive.noPendingPrize}
							getRowKey={(row) => row.d_present_boxes_id}
							columns={[
								{
									key: 'select',
									label: '',
									render: (row) => (
										<Button
											size="small"
											variant="outlined"
											disabled={isSubmitting}
											onClick={() =>
												requestAction(() =>
													onFormChange({
														...emptyArchivePrizeStarForm,
														presentBoxId: row.d_present_boxes_id,
													}),
												)
											}
										>
											{messages.edit}
										</Button>
									),
								},
								{
									key: 'presentBoxId',
									label: messages.archive.presentBoxId,
									render: (row) => row.d_present_boxes_id,
								},
								{
									key: 'liveId',
									label: messages.archive.liveId,
									render: (row) => row.live_id,
								},
								{
									key: 'num',
									label: messages.archive.stars,
									render: (row) => row.num,
								},
								{
									key: 'name',
									label: messages.name,
									render: (row) => row.name,
								},
							]}
						/>
					</Grid>
					{selectedPresent ? (
						<>
							<Grid size={{ xs: 12, md: 8 }}>
								<TextField
									fullWidth
									size="small"
									label={messages.archive.selectedPresentBoxId}
									value={form.presentBoxId}
									slotProps={{ input: { readOnly: true } }}
								/>
							</Grid>
							<Grid size={{ xs: 12, md: 2 }}>
								<TextField
									fullWidth
									size="small"
									label={messages.archive.selectedStars}
									value={`${selectedStarSum}/${selectedPresent.num}`}
									slotProps={{ input: { readOnly: true } }}
								/>
							</Grid>
							<Grid size={{ xs: 12, md: 2 }}>
								<SaveButton
									fullWidth
									type="submit"
									loading={isSubmitting}
									disabled={
										isSubmitting ||
										!canSubmit ||
										!canApplyArchiveStars(form, selectedPresent.num)
									}
								/>
							</Grid>
							<Grid size={{ xs: 12 }}>
								<DataTable<ArchivePrizeCandidate>
									rows={candidates}
									emptyText={messages.archive.noPrizeCandidates}
									getRowKey={(row) => String(row.characterId)}
									columns={[
										{
											key: 'characterId',
											label: messages.characterId,
											render: (row) => row.characterId,
										},
										{
											key: 'level',
											label: messages.users.fanLevel,
											render: (row) => row.memberFanLevel,
										},
										{
											key: 'experience',
											label: messages.archive.fanExperience,
											render: (row) => row.memberFanExperience,
										},
										{
											key: 'stars',
											label: messages.archive.setStars,
											render: (row) => (
												<NumericInput
													label={messages.archive.stars}
													value={
														form.starNumsByCharacterId[row.characterId] ?? '0'
													}
													min={0}
													max={selectedPresent.num}
													step={1}
													disabled={isSubmitting}
													onValueChange={(starNum) =>
														onFormChange(
															setArchivePrizeStarNum(
																form,
																row.characterId,
																starNum,
															),
														)
													}
												/>
											),
										},
									]}
								/>
							</Grid>
						</>
					) : null}
				</Grid>
			</Box>
		</AdminSectionCard>
	);
}
