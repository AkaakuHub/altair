import ReportIcon from '@mui/icons-material/Report';
import { Box, Button, Grid, Stack } from '@mui/material';
import { useState } from 'react';
import { hasAdminDraftChanges } from '../../domain/forms/draft.ts';
import { useAdminFormMutation } from '../../hooks/useAdminFormMutation.ts';
import { useAdminUnsavedChanges } from '../../hooks/useAdminUnsavedChanges.ts';
import { useAdminLanguage } from '../../i18n/AdminLanguageProvider.tsx';
import { AdminFormStatus } from '../components/AdminFormStatus.tsx';
import { AdminSectionCard } from '../components/AdminSectionCard.tsx';
import { DeleteActionButton } from '../components/DeleteActionButton.tsx';
import { NumericInput } from '../components/NumericInput.tsx';
import { PageHeader } from '../components/PageHeader.tsx';
import { SearchablePaginatedDataTable } from '../components/SearchablePaginatedDataTable.tsx';
import { UserSelect } from '../features/circle/CircleSelectFields.tsx';
import {
	createMuteRows,
	createReportRows,
	filterMuteRows,
	filterReportRows,
	type MuteRow,
	type ReportRow,
} from '../features/social/social-model.ts';
import type { AdminPageProps } from '../page-props.ts';

export function SocialPage({
	data,
	onReload,
}: AdminPageProps): React.ReactElement {
	const { messages } = useAdminLanguage();
	const firstUserId = data.state.registeredUsers[0]?.playerId ?? '';
	const secondUserId = data.state.registeredUsers[1]?.playerId ?? '';
	const [reportForm, setReportForm] = useState({
		playerId: firstUserId,
		targetPlayerId: secondUserId,
		reportType: '1',
	});
	const [baseline, setBaseline] = useState(reportForm);
	useAdminUnsavedChanges(hasAdminDraftChanges(baseline, reportForm));
	const { isSubmitting, submitForm, error } = useAdminFormMutation(onReload);
	const reportRows = createReportRows(data.state);
	const muteRows = createMuteRows(data.state);

	return (
		<>
			<PageHeader title={messages.pages.social} onReload={onReload} />
			<AdminFormStatus error={error} />
			<AdminSectionCard title={messages.social.reports}>
				<Box
					component="form"
					onSubmit={(event) => {
						event.preventDefault();
						void submitForm(
							'/admin/social/report',
							{
								...reportForm,
								reportType: Number(reportForm.reportType),
							},
							() => setBaseline(reportForm),
						);
					}}
				>
					<Grid container spacing={2}>
						<Grid size={{ xs: 12, md: 5 }}>
							<UserSelect
								label={messages.social.reporter}
								disabled={isSubmitting}
								users={data.state.registeredUsers}
								value={reportForm.playerId}
								onChange={(playerId) =>
									setReportForm({ ...reportForm, playerId })
								}
							/>
						</Grid>
						<Grid size={{ xs: 12, md: 5 }}>
							<UserSelect
								label={messages.social.target}
								disabled={isSubmitting}
								users={data.state.registeredUsers}
								value={reportForm.targetPlayerId}
								onChange={(targetPlayerId) =>
									setReportForm({ ...reportForm, targetPlayerId })
								}
							/>
						</Grid>
						<Grid size={{ xs: 12, md: 2 }}>
							<NumericInput
								label={messages.social.reportType}
								value={reportForm.reportType}
								min={1}
								max={999}
								step={1}
								disabled={isSubmitting}
								onValueChange={(reportType) =>
									setReportForm({ ...reportForm, reportType })
								}
							/>
						</Grid>
					</Grid>
					<Stack direction="row" sx={{ justifyContent: 'flex-end', mt: 2 }}>
						<Button
							type="submit"
							loading={isSubmitting}
							variant="contained"
							startIcon={<ReportIcon />}
							disabled={
								isSubmitting ||
								reportForm.playerId.length === 0 ||
								reportForm.targetPlayerId.length === 0 ||
								reportForm.playerId === reportForm.targetPlayerId
							}
						>
							{messages.social.saveReport}
						</Button>
					</Stack>
				</Box>
			</AdminSectionCard>

			<SearchablePaginatedDataTable<ReportRow>
				title={messages.social.reports}
				rows={reportRows}
				emptyText={messages.social.noReports}
				getRowKey={(row) => `${row.playerId}:${row.targetPlayerId}`}
				searchLabel={messages.social.searchReports}
				filterRows={filterReportRows}
				columns={[
					{
						key: 'reporter',
						label: messages.social.reporter,
						render: (row) => `${row.playerName} ${row.playerId}`,
					},
					{
						key: 'target',
						label: messages.social.target,
						render: (row) => `${row.targetPlayerName} ${row.targetPlayerId}`,
					},
					{
						key: 'reportType',
						label: messages.social.reportType,
						render: (row) => row.reportType,
					},
					{
						key: 'actions',
						label: messages.action,
						render: (row) => (
							<DeleteActionButton
								label={messages.remove}
								aria-label={messages.social.deleteReport(
									row.playerName,
									row.targetPlayerName,
								)}
								disabled={isSubmitting}
								onClick={() =>
									void submitForm('/admin/social/report/delete', {
										playerId: row.playerId,
										targetPlayerId: row.targetPlayerId,
									})
								}
							/>
						),
					},
				]}
			/>

			<SearchablePaginatedDataTable<MuteRow>
				title={messages.social.muteList}
				rows={muteRows}
				emptyText={messages.social.noMutes}
				getRowKey={(row) => `${row.playerId}:${row.targetPlayerId}`}
				searchLabel={messages.social.searchMutes}
				filterRows={filterMuteRows}
				columns={[
					{
						key: 'player',
						label: messages.user,
						render: (row) => `${row.playerName} ${row.playerId}`,
					},
					{
						key: 'target',
						label: messages.social.mutedPlayer,
						render: (row) => `${row.targetPlayerName} ${row.targetPlayerId}`,
					},
				]}
			/>
		</>
	);
}
