import type { ServerState } from '../server-state-schema.ts';
import type { EnsureStateResult } from './ensure-state-result.ts';
import { isRecord } from './json-state-utils.ts';

export const supportedTutorialIds: ReadonlySet<number> = new Set([
	20, 30, 40, 50, 5010, 5020, 5030, 5040, 5050, 5060, 5070,
]);

export type UserTutorialState = {
	playerId: string;
	completedTutorialIds: number[];
};

export type TutorialStatusResponse = {
	is_complete: boolean;
	tutorial_id: number;
};

function createUserTutorialState(
	playerId: string,
	completedTutorialIds: number[] = [],
): UserTutorialState {
	return {
		playerId,
		completedTutorialIds: [...completedTutorialIds],
	};
}

export function ensureUserTutorialState(
	state: Pick<ServerState, 'userTutorials'>,
	playerId: string,
): EnsureStateResult<UserTutorialState> {
	const existing = state.userTutorials.find(
		(tutorial) => tutorial.playerId === playerId,
	);
	if (existing) {
		return { value: existing, created: false };
	}
	const tutorial = createUserTutorialState(playerId);
	state.userTutorials = [...state.userTutorials, tutorial];
	return { value: tutorial, created: true };
}

export function completeTutorial(
	tutorial: UserTutorialState,
	tutorialId: number,
): void {
	if (!tutorial.completedTutorialIds.includes(tutorialId)) {
		tutorial.completedTutorialIds = [
			...tutorial.completedTutorialIds,
			tutorialId,
		];
	}
}

export function setTutorialCompletion(
	tutorial: UserTutorialState,
	tutorialId: number,
	isComplete: boolean,
): boolean {
	if (!Number.isSafeInteger(tutorialId) || tutorialId <= 0) {
		return false;
	}
	if (isComplete) {
		completeTutorial(tutorial, tutorialId);
		return true;
	}
	tutorial.completedTutorialIds = tutorial.completedTutorialIds.filter(
		(completedTutorialId) => completedTutorialId !== tutorialId,
	);
	return true;
}

export function createTutorialStatusList(
	tutorial: UserTutorialState,
): TutorialStatusResponse[] {
	return [...supportedTutorialIds].map((tutorialId) => {
		return {
			is_complete: tutorial.completedTutorialIds.includes(tutorialId),
			tutorial_id: tutorialId,
		};
	});
}

export function projectCompletedTutorialIds(
	tutorial: UserTutorialState,
	supportedTutorialIds: ReadonlySet<number>,
): number[] {
	return tutorial.completedTutorialIds.filter((tutorialId) =>
		supportedTutorialIds.has(tutorialId),
	);
}

export function isUserTutorialState(
	value: unknown,
): value is UserTutorialState {
	return (
		isRecord(value) &&
		typeof value.playerId === 'string' &&
		Array.isArray(value.completedTutorialIds) &&
		value.completedTutorialIds.every(
			(tutorialId) => typeof tutorialId === 'number',
		)
	);
}
