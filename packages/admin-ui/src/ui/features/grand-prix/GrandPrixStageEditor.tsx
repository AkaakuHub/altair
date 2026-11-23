import type { AdminStateResponse } from '@altair/runtime/admin/dto/admin-state-response-schema.ts';
import { Box, Button, Grid, Typography } from '@mui/material';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { DataTable } from '../../components/DataTable.tsx';
import { NumericInput } from '../../components/NumericInput.tsx';
import type { GrandPrixRuntimeDraft } from './live-grand-prix-draft.ts';
import { setGrandPrixDraftMusic } from './live-grand-prix-draft.ts';
import { getGrandPrixStageMusicValue } from './live-grand-prix-form.ts';

type GrandPrixStageEditorProps = {
	disabled: boolean;
	grandPrixDetail: AdminStateResponse['grandPrixDetail'];
	runtime: GrandPrixRuntimeDraft;
	onRuntimeChange: (runtime: GrandPrixRuntimeDraft) => void;
};

export function GrandPrixStageEditor({
	grandPrixDetail,
	disabled,
	runtime,
	onRuntimeChange,
}: GrandPrixStageEditorProps): React.ReactElement {
	const { messages } = useAdminLanguage();
	return (
		<Box sx={{ mt: 3 }}>
			<Typography variant="h6" sx={{ mb: 1 }}>
				{messages.grandPrix.rhythmSeries}
			</Typography>
			<Grid container spacing={1} sx={{ mb: 3 }}>
				{grandPrixDetail.rhythmGameSeries.map((series) => (
					<Grid key={series.seriesId} size={{ xs: 12, md: 4 }}>
						<Box
							sx={{
								border: 1,
								borderColor: 'divider',
								borderRadius: 1,
								p: 1.5,
							}}
						>
							<Typography variant="subtitle2">
								{messages.grandPrix.seriesLabel(
									series.orderId,
									series.seriesId,
								)}
							</Typography>
							<Typography color="warning.main" variant="body2">
								{messages.grandPrix.unresolved(
									series.unresolvedFields.join(', '),
								)}
							</Typography>
							{series.music.status === 'resolved' ? (
								<Typography variant="body2">
									{messages.grandPrix.musicSound(
										series.music.musicId,
										series.music.soundId,
									)}
								</Typography>
							) : (
								<Typography color="warning.main" variant="body2">
									{messages.grandPrix.unresolved(
										messages.grandPrix.musicReasons[series.music.reason],
									)}
									{series.music.musicId === null
										? ''
										: `／${messages.quest.music} ${series.music.musicId}`}
								</Typography>
							)}
						</Box>
					</Grid>
				))}
			</Grid>
			<Typography variant="h6" sx={{ mb: 1 }}>
				{messages.grandPrix.questStages}
			</Typography>
			{grandPrixDetail.series.map((series) => (
				<Box key={series.seriesId} sx={{ mb: 2 }}>
					<Typography variant="subtitle2" sx={{ mb: 1 }}>
						{series.name} ({series.seriesId})
					</Typography>
					<DataTable
						rows={series.stages}
						emptyText={messages.grandPrix.noStages}
						getRowKey={(stage) => String(stage.stageId)}
						columns={[
							{
								key: 'stage',
								label: messages.quest.stage,
								render: (stage) => `${stage.name} (${stage.stageId})`,
							},
							{
								key: 'original',
								label: messages.grandPrix.originalMusic,
								render: (stage) => stage.questMusicsDetail,
							},
							{
								key: 'music',
								label: messages.quest.music,
								render: (stage) => (
									<NumericInput
										label={messages.quest.music}
										value={getGrandPrixStageMusicValue(
											runtime,
											stage.stageId,
											String(stage.questMusicsDetail),
										)}
										disabled={disabled}
										step={1}
										max={Number.MAX_SAFE_INTEGER}
										onValueChange={(musicId) =>
											onRuntimeChange(
												setGrandPrixDraftMusic(runtime, stage.stageId, musicId),
											)
										}
									/>
								),
							},
							{
								key: 'reset',
								label: messages.action,
								render: (stage) => (
									<Button
										size="small"
										disabled={
											disabled ||
											!runtime.stageOverrides.some(
												(override) => override.stageId === stage.stageId,
											)
										}
										onClick={() =>
											onRuntimeChange(
												setGrandPrixDraftMusic(runtime, stage.stageId, '0'),
											)
										}
									>
										{messages.grandPrix.resetMusic}
									</Button>
								),
							},
						]}
					/>
				</Box>
			))}
			<Typography variant="h6" sx={{ mb: 1, mt: 3 }}>
				{messages.grandPrix.rewards}
			</Typography>
			<Grid container spacing={1}>
				{grandPrixDetail.rewards.map((reward) => (
					<Grid key={reward.rewardId} size={{ xs: 12, md: 4 }}>
						<Box
							sx={{
								border: 1,
								borderColor: 'divider',
								borderRadius: 1,
								p: 1.5,
							}}
						>
							<Typography variant="subtitle2">
								{messages.grandPrix.rewardRange(
									reward.grandPrixRewardType,
									reward.minTargetNum,
									reward.maxTargetNum,
								)}
							</Typography>
							{reward.rewardDatas.map((data) => (
								<Typography key={data.rewardDataId} variant="body2">
									{messages.grandPrix.rewardItem(
										data.rewardItemId,
										data.rewardNum,
										data.rewardType,
									)}
								</Typography>
							))}
						</Box>
					</Grid>
				))}
			</Grid>
		</Box>
	);
}
