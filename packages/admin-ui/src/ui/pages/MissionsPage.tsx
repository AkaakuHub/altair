import { Grid } from '@mui/material';
import { useMemo } from 'react';
import { useAdminFormMutation } from '../../hooks/useAdminFormMutation.ts';
import { useAdminLanguage } from '../../i18n/AdminLanguageProvider.tsx';
import { AdminFormStatus } from '../components/AdminFormStatus.tsx';
import { PageHeader } from '../components/PageHeader.tsx';
import { BeginnerMissionEditor } from '../features/missions/BeginnerMissionEditor.tsx';
import { BeginnerMissionTable } from '../features/missions/BeginnerMissionTable.tsx';
import { ChapterMissionEditor } from '../features/missions/ChapterMissionEditor.tsx';
import { ChapterMissionTable } from '../features/missions/ChapterMissionTable.tsx';
import { CommonMissionEditor } from '../features/missions/CommonMissionEditor.tsx';
import { CommonMissionTables } from '../features/missions/CommonMissionTables.tsx';
import {
	createBeginnerMissionForm,
	createMissionForm,
	createStepUpBeginnerMissionForm,
	findActiveBeginnerMission,
	findActiveChapter,
	findActiveMission,
	findActiveStepUpBeginnerMission,
	getBeginnerMissionCatalog,
	getDailyMissionCatalog,
	getMissionCatalog,
	getStepUpBeginnerMissionCatalog,
	isDerivedMission,
} from '../features/missions/mission-model.ts';
import { SchoolStageStarsCard } from '../features/missions/SchoolStageStarsCard.tsx';
import { StepUpBeginnerMissionEditor } from '../features/missions/StepUpBeginnerMissionEditor.tsx';
import { StepUpBeginnerMissionTable } from '../features/missions/StepUpBeginnerMissionTable.tsx';
import { useMissionDrafts } from '../features/missions/useMissionDrafts.ts';
import { getSelectedAdminPlayerId } from '../features/player-state.ts';
import type { AdminPageProps } from '../page-props.ts';

export function MissionsPage({
	data,
	onReload,
}: AdminPageProps): React.ReactElement {
	const { messages } = useAdminLanguage();
	const selectedAdminPlayerId = getSelectedAdminPlayerId(data);
	const activeMission = findActiveMission(data, selectedAdminPlayerId);
	const activeBeginnerMission = findActiveBeginnerMission(
		data,
		selectedAdminPlayerId,
	);
	const activeStepUpBeginnerMission = findActiveStepUpBeginnerMission(
		data,
		selectedAdminPlayerId,
	);
	const activeChapter = findActiveChapter(data, selectedAdminPlayerId);
	const missionCatalog = useMemo(() => getMissionCatalog(data), [data]);
	const dailyMissionCatalog = useMemo(
		() => getDailyMissionCatalog(data),
		[data],
	);
	const beginnerMissionCatalog = useMemo(
		() => getBeginnerMissionCatalog(data),
		[data],
	);
	const stepUpBeginnerMissionCatalog = getStepUpBeginnerMissionCatalog(
		data,
		activeStepUpBeginnerMission,
	);
	const drafts = useMissionDrafts(data, selectedAdminPlayerId);
	const missionForm = drafts.mission.value;
	const setMissionForm = drafts.mission.setValue;
	const beginnerMissionForm = drafts.beginner.value;
	const setBeginnerMissionForm = drafts.beginner.setValue;
	const stepUpBeginnerMissionForm = drafts.stepUp.value;
	const setStepUpBeginnerMissionForm = drafts.stepUp.setValue;
	const chapterMissionForm = drafts.chapter.value;
	const setChapterMissionForm = drafts.chapter.setValue;
	const { isSubmitting, error, submitPlayerForm } =
		useAdminFormMutation(onReload);
	const isMutationDisabled = selectedAdminPlayerId.length === 0 || isSubmitting;
	const isSelectedMissionDerived = isDerivedMission(
		missionCatalog,
		missionForm.missionId,
	);
	const schoolStageStar = activeMission?.commonMissionInfo.schoolStageStar ?? 0;

	async function saveMission(): Promise<void> {
		await submitPlayerForm(
			'/admin/mission',
			selectedAdminPlayerId,
			{ ...missionForm, achievedNum: Number(missionForm.achievedNum) },
			() => drafts.mission.acceptSaved(missionForm),
		);
	}

	async function saveBeginnerMission(): Promise<void> {
		await submitPlayerForm(
			'/admin/beginner-mission',
			selectedAdminPlayerId,
			{
				...beginnerMissionForm,
				achievedNum: Number(beginnerMissionForm.achievedNum),
			},
			() => drafts.beginner.acceptSaved(beginnerMissionForm),
		);
	}

	async function saveStepUpBeginnerMission(): Promise<void> {
		await submitPlayerForm(
			'/admin/step-up-beginner-mission',
			selectedAdminPlayerId,
			{
				...stepUpBeginnerMissionForm,
				achievedNum: Number(stepUpBeginnerMissionForm.achievedNum),
			},
			() => drafts.stepUp.acceptSaved(stepUpBeginnerMissionForm),
		);
	}

	async function saveChapterMission(): Promise<void> {
		await submitPlayerForm(
			'/admin/chapter-mission-progress',
			selectedAdminPlayerId,
			{
				...chapterMissionForm,
				achievedNum: Number(chapterMissionForm.achievedNum),
				missionId: Number(chapterMissionForm.missionId),
			},
			() => drafts.chapter.acceptSaved(chapterMissionForm),
		);
	}

	return (
		<>
			<PageHeader title={messages.pages.missions} onReload={onReload} />
			<AdminFormStatus
				error={
					error ??
					([drafts.mission, drafts.beginner, drafts.stepUp].some(
						(draft) => !draft.isAvailable && draft.value.missionId !== 0,
					)
						? messages.missions.unavailable
						: null)
				}
				conflicted={Object.values(drafts).some((draft) => draft.conflicted)}
				disabled={isSubmitting}
				onReset={() => {
					for (const draft of Object.values(drafts))
						if (draft.conflicted) draft.reset();
				}}
			/>
			<Grid container spacing={3} sx={{ mb: 3 }}>
				<Grid size={{ xs: 12, lg: 6 }}>
					<CommonMissionEditor
						isSubmitting={isSubmitting}
						isSaveDisabled={isMutationDisabled || !drafts.mission.isAvailable}
						activeMission={activeMission}
						catalog={missionCatalog}
						form={missionForm}
						disabled={isMutationDisabled}
						isDerived={isSelectedMissionDerived}
						onChange={setMissionForm}
						onSave={() => void saveMission()}
					/>
				</Grid>
				<Grid size={{ xs: 12, lg: 6 }}>
					<SchoolStageStarsCard stars={schoolStageStar} />
				</Grid>
				<Grid size={{ xs: 12, lg: 6 }}>
					<BeginnerMissionEditor
						isSubmitting={isSubmitting}
						isSaveDisabled={isMutationDisabled || !drafts.beginner.isAvailable}
						activeMission={activeBeginnerMission}
						catalog={beginnerMissionCatalog}
						form={beginnerMissionForm}
						disabled={isMutationDisabled}
						onChange={setBeginnerMissionForm}
						onSave={() => void saveBeginnerMission()}
					/>
				</Grid>
				<Grid size={{ xs: 12, lg: 6 }}>
					<StepUpBeginnerMissionEditor
						isSubmitting={isSubmitting}
						isSaveDisabled={isMutationDisabled || !drafts.stepUp.isAvailable}
						activeMission={activeStepUpBeginnerMission}
						catalog={stepUpBeginnerMissionCatalog}
						form={stepUpBeginnerMissionForm}
						disabled={isMutationDisabled}
						onChange={setStepUpBeginnerMissionForm}
						onSave={() => void saveStepUpBeginnerMission()}
					/>
				</Grid>
				<Grid size={{ xs: 12, lg: 6 }}>
					<ChapterMissionEditor
						isSubmitting={isSubmitting}
						isSaveDisabled={isMutationDisabled || !drafts.chapter.isAvailable}
						form={chapterMissionForm}
						disabled={isMutationDisabled}
						onChange={setChapterMissionForm}
						onSave={() => void saveChapterMission()}
					/>
				</Grid>
			</Grid>
			<CommonMissionTables
				disabled={isMutationDisabled}
				catalog={missionCatalog}
				dailyCatalog={dailyMissionCatalog}
				mission={activeMission}
				selectedMissionId={missionForm.missionId}
				onSelect={(missionId) =>
					setMissionForm(createMissionForm(activeMission, missionId))
				}
			/>
			<BeginnerMissionTable
				disabled={isMutationDisabled}
				catalog={beginnerMissionCatalog}
				mission={activeBeginnerMission}
				selectedMissionId={beginnerMissionForm.missionId}
				onSelect={(missionId) =>
					setBeginnerMissionForm(
						createBeginnerMissionForm(activeBeginnerMission, missionId),
					)
				}
			/>
			<StepUpBeginnerMissionTable
				disabled={isMutationDisabled}
				catalog={stepUpBeginnerMissionCatalog}
				mission={activeStepUpBeginnerMission}
				selectedMissionId={stepUpBeginnerMissionForm.missionId}
				onSelect={(missionId) =>
					setStepUpBeginnerMissionForm(
						createStepUpBeginnerMissionForm(
							activeStepUpBeginnerMission,
							missionId,
						),
					)
				}
			/>
			<ChapterMissionTable
				disabled={isMutationDisabled}
				rows={activeChapter?.missionProgresses ?? []}
				selectedMissionId={Number(chapterMissionForm.missionId)}
				onSelect={(row) =>
					drafts.chapter.acceptSaved({
						...row,
						missionId: String(row.missionId),
						achievedNum: String(row.achievedNum),
					})
				}
			/>
		</>
	);
}
