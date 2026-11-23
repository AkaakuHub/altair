import { parseBoundedFormInteger } from '@altair/runtime/admin/domain/forms/integer.ts';
import type { AdminLearningMusicMastery } from '@altair/runtime/admin/dto/admin-visible-state-schema.ts';
import { useCallback, useMemo, useState } from 'react';
import { useAdminFormDraft } from '../../hooks/useAdminFormDraft.ts';
import { useAdminFormMutation } from '../../hooks/useAdminFormMutation.ts';
import { useAdminUnsavedChanges } from '../../hooks/useAdminUnsavedChanges.ts';
import { useAdminLanguage } from '../../i18n/AdminLanguageProvider.tsx';
import { AdminFormStatus } from '../components/AdminFormStatus.tsx';
import { PageHeader } from '../components/PageHeader.tsx';
import { findActiveMission } from '../features/missions/mission-model.ts';
import { getSelectedAdminPlayerId } from '../features/player-state.ts';
import { QuestStateTables } from '../features/quest/QuestStateTables.tsx';
import {
	createDreamLiveProgressDraft,
	createGradeProgressDraft,
	createGrandPrixProgressDraft,
	createLearningProgressDraft,
	createQuestProgressDraft,
	type DailyTicketDraft,
	type DreamLiveProgressDraft,
	type GradeProgressDraft,
	type GrandPrixProgressDraft,
	hasQuestProgressChanges,
	type LearningProgressDraft,
	type QuestProgressDraft,
} from '../features/quest/quest-drafts.ts';
import {
	dreamLiveProgressKey,
	findActiveDailyQuest,
	findActiveLive,
	flattenGrandPrixProgress,
	gradeProgressKey,
	grandPrixProgressKey,
	learningMasteryKey,
	mergeEdits,
	normalizeLearningForm,
	questProgressKey,
	removeEdit,
} from '../features/quest/quest-model.ts';
import { createStandardQuestRowsByArea } from '../features/quest/quest-state-table-model.ts';
import type { AdminPageProps } from '../page-props.ts';

export function QuestPage({
	data,
	onReload,
}: AdminPageProps): React.ReactElement {
	const { messages } = useAdminLanguage();
	const selectedAdminPlayerId = getSelectedAdminPlayerId(data);
	const activeLive = findActiveLive(data, selectedAdminPlayerId);
	const activeDailyQuest = findActiveDailyQuest(data, selectedAdminPlayerId);
	const activeMission = findActiveMission(data, selectedAdminPlayerId);
	const resolveDailyTicket = useCallback(
		(): DailyTicketDraft => ({
			num: String(activeDailyQuest?.userDailyTicketInfo.num ?? 3),
			max: String(activeDailyQuest?.userDailyTicketInfo.max ?? 3),
		}),
		[activeDailyQuest],
	);
	const dailyTicket = useAdminFormDraft(
		resolveDailyTicket(),
		resolveDailyTicket,
		dailyTicketKey,
	);
	const dailyTicketForm = dailyTicket.value;
	const setDailyTicketForm = dailyTicket.setValue;
	const [questEdits, setQuestEdits] = useState<
		Record<string, QuestProgressDraft>
	>({});
	const [dreamLiveEdits, setDreamLiveEdits] = useState<
		Record<string, DreamLiveProgressDraft>
	>({});
	const [learningEdits, setLearningEdits] = useState<
		Record<string, LearningProgressDraft>
	>({});
	const [gradeEdits, setGradeEdits] = useState<
		Record<string, GradeProgressDraft>
	>({});
	const [grandPrixEdits, setGrandPrixEdits] = useState<
		Record<string, GrandPrixProgressDraft>
	>({});
	const standardQuestRows = useMemo(
		() =>
			createStandardQuestRowsByArea(
				data.standardQuestAreas,
				activeLive?.questStageProgressList ?? [],
			),
		[data.standardQuestAreas, activeLive],
	);
	const questRows = useMemo(
		() =>
			standardQuestRows.flatMap(({ rows }) =>
				rows.map(({ progress }) => createQuestProgressDraft(progress)),
			),
		[standardQuestRows],
	);
	const learningRows = useMemo(
		() =>
			(activeLive?.learningMusicMasteries ?? []).map(
				createLearningProgressDraft,
			),
		[activeLive],
	);
	const dreamLiveRows = useMemo(
		() =>
			(activeLive?.dreamLiveProgressList ?? []).map(
				createDreamLiveProgressDraft,
			),
		[activeLive],
	);
	const gradeRows = useMemo(
		() =>
			(activeLive?.gradeQuestProgressList ?? []).map(createGradeProgressDraft),
		[activeLive],
	);
	const grandPrixRows = useMemo(
		() =>
			flattenGrandPrixProgress(activeLive).map(createGrandPrixProgressDraft),
		[activeLive],
	);
	const editableLearningRows = useMemo(
		() => mergeEdits(learningRows, learningEdits, learningMasteryKey),
		[learningRows, learningEdits],
	);
	const editableDreamLiveRows = useMemo(
		() => mergeEdits(dreamLiveRows, dreamLiveEdits, dreamLiveProgressKey),
		[dreamLiveRows, dreamLiveEdits],
	);
	const editableGradeRows = useMemo(
		() => mergeEdits(gradeRows, gradeEdits, gradeProgressKey),
		[gradeRows, gradeEdits],
	);
	const editableGrandPrixRows = useMemo(
		() => mergeEdits(grandPrixRows, grandPrixEdits, grandPrixProgressKey),
		[grandPrixRows, grandPrixEdits],
	);
	const hasProgressChanges = useMemo(
		() =>
			hasQuestProgressChanges(questRows, questEdits, questProgressKey) ||
			hasQuestProgressChanges(
				learningRows,
				learningEdits,
				learningMasteryKey,
			) ||
			hasQuestProgressChanges(
				dreamLiveRows,
				dreamLiveEdits,
				dreamLiveProgressKey,
			) ||
			hasQuestProgressChanges(gradeRows, gradeEdits, gradeProgressKey) ||
			hasQuestProgressChanges(
				grandPrixRows,
				grandPrixEdits,
				grandPrixProgressKey,
			),
		[
			questRows,
			questEdits,
			learningRows,
			learningEdits,
			dreamLiveRows,
			dreamLiveEdits,
			gradeRows,
			gradeEdits,
			grandPrixRows,
			grandPrixEdits,
		],
	);
	useAdminUnsavedChanges(hasProgressChanges);
	const standardStar = activeMission?.commonMissionInfo.schoolStageStar ?? 0;
	const { isSubmitting, error, submitPlayerForm } =
		useAdminFormMutation(onReload);
	const isMutationDisabled = selectedAdminPlayerId.length === 0 || isSubmitting;

	async function saveQuestProgressForm(
		form: QuestProgressDraft,
	): Promise<void> {
		await submitPlayerForm(
			'/admin/quest-progress',
			selectedAdminPlayerId,
			{
				questLiveType: form.questLiveType,
				stageId: form.stageId,
				highScore: Number(form.highScore),
				playCount: Number(form.playCount),
				bestLoveMusicId: Number(form.bestLoveMusicId),
			},
			() => setQuestEdits(removeEdit(questProgressKey(form))),
		);
	}

	async function saveDreamLiveProgressForm(
		form: DreamLiveProgressDraft,
	): Promise<void> {
		await submitPlayerForm(
			'/admin/dream-live-progress',
			selectedAdminPlayerId,
			{
				stageId: form.stageId,
				clearTimes: Number(form.clearTimes),
				isGetCard: form.isGetCard,
				limitBreakTimes: Number(form.limitBreakTimes),
			},
			() => setDreamLiveEdits(removeEdit(dreamLiveProgressKey(form))),
		);
	}

	function updateLearningEdit(
		row: LearningProgressDraft,
		patch: Partial<LearningProgressDraft>,
	): void {
		setLearningEdits((current) => {
			const value = current[learningMasteryKey(row)] ?? row;
			const next = { ...value, ...patch };
			const numericPatch: Partial<AdminLearningMusicMastery> = {};
			if (patch.isMastery !== undefined)
				numericPatch.isMastery = patch.isMastery;
			if (patch.musicExpLevel !== undefined) {
				const level = parseBoundedFormInteger(
					patch.musicExpLevel === '' ? '' : String(Number(patch.musicExpLevel)),
					0,
					50,
				);
				if (level === undefined)
					return { ...current, [learningMasteryKey(row)]: next };
				numericPatch.musicExpLevel = level;
			}
			if (patch.earnedMusicExp !== undefined) {
				const experience = parseBoundedFormInteger(
					patch.earnedMusicExp === ''
						? ''
						: String(Number(patch.earnedMusicExp)),
					0,
					999_999_999,
				);
				if (experience === undefined)
					return { ...current, [learningMasteryKey(row)]: next };
				numericPatch.earnedMusicExp = experience;
			}
			if (patch.isMastery === true && value.earnedMusicExp === '')
				return { ...current, [learningMasteryKey(row)]: next };
			return {
				...current,
				[learningMasteryKey(row)]: createLearningProgressDraft(
					normalizeLearningForm(
						{
							...value,
							musicExpLevel: Number(value.musicExpLevel),
							earnedMusicExp: Number(value.earnedMusicExp),
						},
						numericPatch,
						data.musicLevelTable,
					),
				),
			};
		});
	}

	async function saveLearningForm(form: LearningProgressDraft): Promise<void> {
		await submitPlayerForm(
			'/admin/learning-mastery',
			selectedAdminPlayerId,
			{
				musicId: form.musicId,
				musicExpLevel: Number(form.musicExpLevel),
				earnedMusicExp: Number(form.earnedMusicExp),
				isMastery: form.isMastery,
			},
			() => setLearningEdits(removeEdit(learningMasteryKey(form))),
		);
	}

	async function saveGradeProgressForm(
		form: GradeProgressDraft,
	): Promise<void> {
		await submitPlayerForm(
			'/admin/grade-quest-progress',
			selectedAdminPlayerId,
			{ ...form, clearStatus: Number(form.clearStatus) },
			() => setGradeEdits(removeEdit(gradeProgressKey(form))),
		);
	}

	async function saveGrandPrixProgressForm(
		form: GrandPrixProgressDraft,
	): Promise<void> {
		await submitPlayerForm(
			'/admin/grand-prix-stage-progress',
			selectedAdminPlayerId,
			{
				...form,
				highScore: Number(form.highScore),
				dailyBestScore: Number(form.dailyBestScore),
				playCount: Number(form.playCount),
			},
			() => setGrandPrixEdits(removeEdit(grandPrixProgressKey(form))),
		);
	}

	async function saveDailyTicket(): Promise<void> {
		await submitPlayerForm(
			'/admin/daily-quest-ticket',
			selectedAdminPlayerId,
			{ num: Number(dailyTicketForm.num), max: Number(dailyTicketForm.max) },
			() => dailyTicket.acceptSaved(dailyTicketForm),
		);
	}

	return (
		<>
			<PageHeader title={messages.pages.quest} onReload={onReload} />
			<AdminFormStatus
				error={error}
				conflicted={dailyTicket.conflicted}
				onReset={dailyTicket.reset}
				disabled={isSubmitting}
			/>
			{activeLive ? (
				<QuestStateTables
					standardQuestRows={standardQuestRows}
					questEdits={questEdits}
					dreamLiveRows={editableDreamLiveRows}
					learningRows={editableLearningRows}
					gradeRows={editableGradeRows}
					currentGradeQuest={activeLive.currentGradeQuest}
					grandPrixRows={editableGrandPrixRows}
					dailyTicketForm={dailyTicketForm}
					standardStar={standardStar}
					isMutationDisabled={isMutationDisabled}
					onQuestChange={(row, patch) =>
						setQuestEdits((current) => ({
							...current,
							[questProgressKey(row)]: { ...row, ...patch },
						}))
					}
					onDreamLiveChange={(row, patch) =>
						setDreamLiveEdits((current) => ({
							...current,
							[dreamLiveProgressKey(row)]: { ...row, ...patch },
						}))
					}
					onLearningChange={updateLearningEdit}
					onGradeChange={(row, patch) =>
						setGradeEdits((current) => ({
							...current,
							[gradeProgressKey(row)]: { ...row, ...patch },
						}))
					}
					onGrandPrixChange={(row, patch) =>
						setGrandPrixEdits((current) => ({
							...current,
							[grandPrixProgressKey(row)]: { ...row, ...patch },
						}))
					}
					onDailyTicketChange={(patch) =>
						setDailyTicketForm((current) => ({ ...current, ...patch }))
					}
					onQuestSave={saveQuestProgressForm}
					onDreamLiveSave={saveDreamLiveProgressForm}
					onLearningSave={saveLearningForm}
					onGradeSave={saveGradeProgressForm}
					onGrandPrixSave={saveGrandPrixProgressForm}
					onDailyTicketSave={saveDailyTicket}
				/>
			) : null}
		</>
	);
}

function dailyTicketKey(): string {
	return 'daily-ticket';
}
