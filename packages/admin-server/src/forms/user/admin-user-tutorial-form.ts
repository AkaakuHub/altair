import type { ServerState } from '../../../../../src/server-state-schema.ts';
import {
	ensureUserProfileSettings,
	setSimpleTutorialFinished,
} from '../../../../../src/state/profile-settings-state.ts';
import {
	ensureUserTutorialState,
	setTutorialCompletion,
} from '../../../../../src/state/user-tutorial-state.ts';
import {
	type AdminForm,
	getAdminPositiveId,
	getFormBoolean,
	getFormString,
} from '../shared/admin-form-values.ts';

export function updateUserTutorialFromForm(
	form: AdminForm,
	state: ServerState,
	supportedTutorialIds: ReadonlySet<number>,
): boolean {
	const playerId = getFormString(form, 'playerId');
	const tutorialId = getAdminPositiveId(form, 'tutorialId');
	if (
		playerId.length === 0 ||
		tutorialId === undefined ||
		!supportedTutorialIds.has(tutorialId)
	)
		return false;
	return setTutorialCompletion(
		ensureUserTutorialState(state, playerId).value,
		tutorialId,
		getFormBoolean(form, 'isComplete'),
	);
}

export function updateSimpleTutorialFromForm(
	form: AdminForm,
	state: ServerState,
): boolean {
	const playerId = getFormString(form, 'playerId');
	const contentsId = getAdminPositiveId(form, 'contentsId');
	if (playerId.length === 0 || contentsId === undefined) return false;
	return setSimpleTutorialFinished(
		ensureUserProfileSettings(state, playerId).value,
		contentsId,
		getFormBoolean(form, 'isFinished'),
	);
}
