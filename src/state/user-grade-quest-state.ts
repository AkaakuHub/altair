import type {
	EntityIdentityFingerprint,
	EntityProvenance,
} from './entity-provenance.ts';
import { isArrayOf, isRecord } from './json-state-utils.ts';
import { findCompatibleMasterBoundProgress } from './master-bound-progress.ts';

export type UserGradeQuestSquareState = {
	squareId: number;
	status: number;
	livePoint: number;
};

export type UserGradeQuestState = {
	masterReleaseId?: string;
	seriesId: number;
	actionPoint: number;
	currentSquareId: number;
	resourceValue: number;
	squares: UserGradeQuestSquareState[];
	activeAddSkillIds: number[];
};

export type UserGradeQuestProgressState = {
	sourceMasterReleaseId?: string;
	identityFingerprint?: EntityIdentityFingerprint;
	seriesId: number;
	clearStatus: number;
	bonusCleared: boolean;
};

export function findCompatibleGradeQuestProgress(
	progresses: readonly UserGradeQuestProgressState[],
	seriesId: number,
	identityFingerprint: EntityIdentityFingerprint,
): UserGradeQuestProgressState | undefined {
	return findCompatibleMasterBoundProgress(
		progresses,
		(progress) => progress.seriesId === seriesId,
		identityFingerprint,
	);
}

export function saveGradeQuestProgress(
	progresses: readonly UserGradeQuestProgressState[],
	progress: UserGradeQuestProgressState,
	provenance: EntityProvenance,
): UserGradeQuestProgressState[] {
	return [
		...progresses.filter(
			(current) =>
				current.seriesId !== progress.seriesId ||
				current.identityFingerprint?.domain !==
					provenance.identityFingerprint.domain ||
				current.identityFingerprint.value !==
					provenance.identityFingerprint.value,
		),
		{ ...progress, ...provenance },
	];
}

export function isUserGradeQuestState(
	value: unknown,
): value is UserGradeQuestState {
	if (!isRecord(value)) {
		return false;
	}
	return (
		(value.masterReleaseId === undefined ||
			typeof value.masterReleaseId === 'string') &&
		typeof value.seriesId === 'number' &&
		typeof value.actionPoint === 'number' &&
		typeof value.currentSquareId === 'number' &&
		typeof value.resourceValue === 'number' &&
		isArrayOf(value.squares, isUserGradeQuestSquareState) &&
		Array.isArray(value.activeAddSkillIds) &&
		value.activeAddSkillIds.every((skillId) => typeof skillId === 'number')
	);
}

function isUserGradeQuestSquareState(
	value: unknown,
): value is UserGradeQuestSquareState {
	if (!isRecord(value)) {
		return false;
	}
	return (
		typeof value.squareId === 'number' &&
		typeof value.status === 'number' &&
		typeof value.livePoint === 'number'
	);
}

export function isUserGradeQuestProgressState(
	value: unknown,
): value is UserGradeQuestProgressState {
	if (!isRecord(value)) {
		return false;
	}
	return (
		(value.sourceMasterReleaseId === undefined ||
			typeof value.sourceMasterReleaseId === 'string') &&
		(value.identityFingerprint === undefined ||
			(isRecord(value.identityFingerprint) &&
				typeof value.identityFingerprint.domain === 'string' &&
				typeof value.identityFingerprint.value === 'string')) &&
		typeof value.seriesId === 'number' &&
		typeof value.clearStatus === 'number' &&
		typeof value.bonusCleared === 'boolean'
	);
}
