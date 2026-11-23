import type { ServerState } from '../server-state-schema.ts';
import { ensureUserGrandPrixState } from './user-grand-prix-state.ts';
import { saveLegacyUserLearningMusicMastery } from './user-learning-music-state.ts';
import { ensureUserLiveState } from './user-live-state.ts';

export function updateUserLearningMusicMastery(
	state: ServerState,
	playerId: string,
	musicId: number,
	musicExpLevel: number,
	earnedMusicExp: number,
	isMastery: boolean,
): boolean {
	if (!state.registeredUsers.some((user) => user.playerId === playerId)) {
		return false;
	}
	const userLive = ensureUserLiveState(state, playerId).value;
	saveLegacyUserLearningMusicMastery(userLive, {
		musicId,
		musicExpLevel,
		earnedMusicExp,
		isMastery,
	});
	return true;
}

export function updateUserQuestStageProgress(
	state: ServerState,
	playerId: string,
	questLiveType: number,
	stageId: number,
	highScore: number,
	playCount: number,
	bestLoveMusicId: number,
): boolean {
	if (!state.registeredUsers.some((user) => user.playerId === playerId)) {
		return false;
	}
	const userLive = ensureUserLiveState(state, playerId).value;
	userLive.questStageProgressList = [
		...userLive.questStageProgressList.filter(
			(progress) =>
				progress.questLiveType !== questLiveType ||
				progress.stageId !== stageId,
		),
		{
			questLiveType,
			stageId,
			highScore,
			bestLoveMusicId,
			playCount,
		},
	].sort(
		(left, right) =>
			left.questLiveType - right.questLiveType || left.stageId - right.stageId,
	);
	return true;
}

export function updateUserDreamLiveProgress(
	state: ServerState,
	playerId: string,
	stageId: number,
	clearTimes: number,
	isGetCard: boolean,
	limitBreakTimes: number,
): boolean {
	if (!state.registeredUsers.some((user) => user.playerId === playerId)) {
		return false;
	}
	const userLive = ensureUserLiveState(state, playerId).value;
	userLive.dreamLiveProgressList = [
		...userLive.dreamLiveProgressList.filter(
			(progress) => progress.stageId !== stageId,
		),
		{
			stageId,
			clearTimes,
			isGetCard,
			limitBreakTimes,
		},
	].sort((left, right) => left.stageId - right.stageId);
	return true;
}

export function updateUserGradeQuestProgress(
	state: ServerState,
	playerId: string,
	seriesId: number,
	clearStatus: number,
	bonusCleared: boolean,
): boolean {
	if (!state.registeredUsers.some((user) => user.playerId === playerId)) {
		return false;
	}
	const userLive = ensureUserLiveState(state, playerId).value;
	userLive.gradeQuestProgressList = [
		...userLive.gradeQuestProgressList.filter(
			(progress) =>
				progress.seriesId !== seriesId ||
				progress.identityFingerprint !== undefined,
		),
		{ seriesId, clearStatus, bonusCleared },
	].sort((left, right) => left.seriesId - right.seriesId);
	return true;
}

export function updateUserGrandPrixStageProgress(
	state: ServerState,
	playerId: string,
	grandPrixId: number,
	stageId: number,
	highScore: number,
	dailyBestScore: number,
	playCount: number,
): boolean {
	if (!state.registeredUsers.some((user) => user.playerId === playerId)) {
		return false;
	}
	const grandPrix = ensureUserGrandPrixState(
		ensureUserLiveState(state, playerId).value,
		grandPrixId,
	);
	grandPrix.stageProgressList = [
		...grandPrix.stageProgressList.filter(
			(progress) => progress.stageId !== stageId,
		),
		{ stageId, highScore, dailyBestScore, playCount },
	].sort((left, right) => left.stageId - right.stageId);
	return true;
}
