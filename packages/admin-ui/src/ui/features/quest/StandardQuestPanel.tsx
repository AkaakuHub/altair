import type { AdminStateResponse } from '@altair/runtime/admin/dto/admin-state-response-schema.ts';
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Box,
	Chip,
	Stack,
	Switch,
	Typography,
} from '@mui/material';
import { useId } from 'react';
import { useAdminLanguage } from '../../../i18n/AdminLanguageProvider.tsx';
import { AdminSectionCard } from '../../components/AdminSectionCard.tsx';
import { DataTable } from '../../components/DataTable.tsx';
import { NumericInput } from '../../components/NumericInput.tsx';
import { SaveButton } from '../../components/SaveButton.tsx';
import type { QuestProgressDraft } from './quest-drafts.ts';

type StandardQuestArea = AdminStateResponse['standardQuestAreas'][number];
type StandardQuestStage = StandardQuestArea['stages'][number];
type StandardQuestStageRow = {
	area: StandardQuestArea;
	stage: StandardQuestStage;
	progress: QuestProgressDraft;
};

export function StandardQuestPanel({
	areas,
	standardStar,
	isMutationDisabled,
	onQuestChange,
	onQuestSave,
}: {
	areas: Array<{ area: StandardQuestArea; rows: StandardQuestStageRow[] }>;
	standardStar: number;
	isMutationDisabled: boolean;
	onQuestChange: (
		row: QuestProgressDraft,
		patch: Partial<QuestProgressDraft>,
	) => void;
	onQuestSave: (form: QuestProgressDraft) => Promise<void>;
}): React.ReactElement {
	const { messages } = useAdminLanguage();
	const formPrefix = useId();
	return (
		<Stack spacing={1.5}>
			<AdminSectionCard sx={{ mb: 0 }}>
				<Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
					<Typography variant="subtitle1">
						{messages.quest.standardProgress}
					</Typography>
					<Chip
						size="small"
						label={messages.quest.standardStars(standardStar)}
					/>
				</Stack>
			</AdminSectionCard>
			{areas.map(({ area, rows }) => (
				<Accordion key={area.areaId} disableGutters>
					<AccordionSummary>
						<Stack
							direction={{ xs: 'column', md: 'row' }}
							spacing={1}
							sx={{ alignItems: { xs: 'flex-start', md: 'center' } }}
						>
							<Typography variant="subtitle2">
								{area.name} ({area.areaId})
							</Typography>
							<Chip
								size="small"
								label={messages.quest.generation(area.generationId)}
							/>
							<Chip
								size="small"
								label={`${rows.filter((row) => Number(row.progress.playCount) > 0).length}/${rows.length}`}
							/>
						</Stack>
					</AccordionSummary>
					<AccordionDetails>
						<DataTable<StandardQuestStageRow>
							rows={rows}
							emptyText={messages.quest.noStandardStages}
							getRowKey={(row) => String(row.stage.stageId)}
							columns={[
								{
									key: 'stage',
									label: messages.quest.stage,
									render: (row) => (
										<Box>
											<Typography variant="body2">
												{row.stage.name} ({row.stage.stageId})
											</Typography>
											<Typography variant="caption" color="text.secondary">
												{messages.quest.stageDetails(
													row.stage.questMusicsDetail,
													row.stage.questLevel,
												)}
											</Typography>
										</Box>
									),
								},
								{
									key: 'target',
									label: messages.quest.targets,
									render: (row) =>
										`${row.stage.score1} / ${row.stage.score2} / ${row.stage.score3}`,
								},
								{
									key: 'score',
									label: messages.quest.highScore,
									render: (row) => (
										<NumericInput
											label={messages.quest.highScore}
											value={row.progress.highScore}
											form={`${formPrefix}-${row.stage.stageId}`}
											disabled={isMutationDisabled}
											step={1}
											max={999999999}
											min={0}
											onValueChange={(highScore) =>
												onQuestChange(row.progress, { highScore })
											}
										/>
									),
								},
								{
									key: 'music',
									label: messages.quest.bestMusic,
									render: (row) => (
										<NumericInput
											label={messages.quest.bestMusic}
											value={row.progress.bestLoveMusicId}
											form={`${formPrefix}-${row.stage.stageId}`}
											disabled={isMutationDisabled}
											step={1}
											max={999999999}
											min={0}
											onValueChange={(bestLoveMusicId) =>
												onQuestChange(row.progress, { bestLoveMusicId })
											}
										/>
									),
								},
								{
									key: 'count',
									label: messages.quest.playCount,
									render: (row) => (
										<NumericInput
											label={messages.quest.playCount}
											value={row.progress.playCount}
											form={`${formPrefix}-${row.stage.stageId}`}
											disabled={isMutationDisabled}
											step={1}
											max={999999}
											min={0}
											onValueChange={(playCount) =>
												onQuestChange(row.progress, { playCount })
											}
										/>
									),
								},
								{
									key: 'clear',
									label: messages.quest.clear,
									render: (row) => (
										<Switch
											slotProps={{
												input: { 'aria-label': messages.quest.clear },
											}}
											disabled={isMutationDisabled}
											checked={Number(row.progress.playCount) > 0}
											onChange={(event) =>
												onQuestChange(row.progress, {
													playCount: event.target.checked ? '1' : '0',
												})
											}
										/>
									),
								},
								{
									key: 'action',
									label: messages.action,
									render: (row) => (
										<Box
											component="form"
											id={`${formPrefix}-${row.stage.stageId}`}
											onSubmit={(event) => {
												event.preventDefault();
												void onQuestSave(row.progress);
											}}
										>
											<SaveButton
												type="submit"
												size="small"
												disabled={isMutationDisabled}
											/>
										</Box>
									),
								},
							]}
						/>
					</AccordionDetails>
				</Accordion>
			))}
		</Stack>
	);
}
