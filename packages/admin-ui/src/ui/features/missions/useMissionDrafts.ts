import { useCallback } from 'react';
import { useAdminFormDraft } from '../../../hooks/useAdminFormDraft.ts';
import type { AdminPageProps } from '../../page-props.ts';
import {
	type BeginnerMissionForm,
	type ChapterMissionForm,
	createBeginnerMissionForm,
	createChapterMissionDraft,
	createMissionForm,
	createStepUpBeginnerMissionForm,
	findActiveBeginnerMission,
	findActiveChapter,
	findActiveMission,
	findActiveStepUpBeginnerMission,
	getBeginnerMissionCatalog,
	getMissionCatalog,
	getStepUpBeginnerMissionCatalog,
	type MissionForm,
	type StepUpBeginnerMissionForm,
} from './mission-model.ts';

function missionKey(value: { missionId: number | string }): string {
	return String(value.missionId);
}

function chapterKey(value: { sourceId: string }): string {
	return value.sourceId;
}

export function useMissionDrafts(
	data: AdminPageProps['data'],
	playerId: string,
) {
	const mission = findActiveMission(data, playerId);
	const beginner = findActiveBeginnerMission(data, playerId);
	const stepUp = findActiveStepUpBeginnerMission(data, playerId);
	const chapter = findActiveChapter(data, playerId);
	const resolveMission = useCallback(
		(value: MissionForm) => {
			const catalog = getMissionCatalog(data);
			const id = value.missionId || catalog[0]?.missionId || 0;
			return catalog.some((entry) => entry.missionId === id)
				? createMissionForm(mission, id)
				: null;
		},
		[data, mission],
	);
	const resolveBeginner = useCallback(
		(value: BeginnerMissionForm) => {
			const catalog = getBeginnerMissionCatalog(data);
			const id = value.missionId || catalog[0]?.missionId || 0;
			return catalog.some((entry) => entry.missionId === id)
				? createBeginnerMissionForm(beginner, id)
				: null;
		},
		[data, beginner],
	);
	const resolveStepUp = useCallback(
		(value: StepUpBeginnerMissionForm) => {
			const catalog = getStepUpBeginnerMissionCatalog(data, stepUp);
			const id = value.missionId || catalog[0]?.missionId || 0;
			return catalog.some((entry) => entry.missionId === id)
				? createStepUpBeginnerMissionForm(stepUp, id)
				: null;
		},
		[data, stepUp],
	);
	const resolveChapter = useCallback(
		(value: { sourceId: string }) =>
			createChapterMissionDraft(chapter, value.sourceId),
		[chapter],
	);
	const chapterDraft = useAdminFormDraft(
		resolveChapter({ sourceId: '4101' }),
		resolveChapter,
		chapterKey,
	);
	const setChapterValue = useCallback(
		(form: ChapterMissionForm) => {
			chapterDraft.setValue((current) => ({ ...current, form }));
		},
		[chapterDraft.setValue],
	);
	const acceptChapterSaved = useCallback(
		(form: ChapterMissionForm) => {
			const next = { sourceId: form.missionId, form };
			if (chapterDraft.value.sourceId === next.sourceId)
				chapterDraft.acceptSaved(next);
			else chapterDraft.setValue(next);
		},
		[
			chapterDraft.value.sourceId,
			chapterDraft.acceptSaved,
			chapterDraft.setValue,
		],
	);
	return {
		mission: useAdminFormDraft(
			createMissionForm(mission, getMissionCatalog(data)[0]?.missionId ?? 0),
			resolveMission,
			missionKey,
		),
		beginner: useAdminFormDraft(
			createBeginnerMissionForm(
				beginner,
				getBeginnerMissionCatalog(data)[0]?.missionId ?? 0,
			),
			resolveBeginner,
			missionKey,
		),
		stepUp: useAdminFormDraft(
			createStepUpBeginnerMissionForm(
				stepUp,
				getStepUpBeginnerMissionCatalog(data, stepUp)[0]?.missionId ?? 0,
			),
			resolveStepUp,
			missionKey,
		),
		chapter: {
			...chapterDraft,
			value: chapterDraft.value.form,
			setValue: setChapterValue,
			acceptSaved: acceptChapterSaved,
		},
	};
}
