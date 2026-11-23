import type { ServerState } from '../../../../../../src/server-state-schema.ts';
import { setContentReleaseEffectHistory } from '../../../../../../src/state/content-release-state.ts';
import {
	ensureUserTutorialState,
	setTutorialCompletion,
} from '../../../../../../src/state/user-tutorial-state.ts';
import {
	type OfficialApiDumpEvent,
	type OfficialDataMigrationDump,
	readNumber,
	readNumberArray,
	readRecordArray,
} from '../official-data-migration-dump.ts';

export function applyUserFlagsFromDump(
	state: ServerState,
	playerId: string,
	dump: OfficialDataMigrationDump,
): string[] {
	const appliedCategories: string[] = [];
	if (applyUserTutorialsFromDump(state, playerId, dump)) {
		appliedCategories.push('userTutorials');
	}
	if (applyContentReleaseEffectsFromDump(state, playerId, dump.events)) {
		appliedCategories.push('contentReleaseEffects');
	}
	return appliedCategories;
}

function applyUserTutorialsFromDump(
	state: ServerState,
	playerId: string,
	dump: OfficialDataMigrationDump,
): boolean {
	const tutorial = ensureUserTutorialState(state, playerId).value;
	let applied = false;
	for (const event of dump.events) {
		if (
			event.path !== '/v1/user/login' ||
			event.response === null ||
			!isSuccessfulStatus(event)
		) {
			continue;
		}
		for (const status of readRecordArray(
			event.response.tutorials_status_list,
		)) {
			const tutorialId = readNumber(status.tutorial_id);
			if (tutorialId !== null) {
				setTutorialCompletion(
					tutorial,
					tutorialId,
					status.is_complete === true,
				);
				applied = true;
			}
		}
	}
	for (const tutorialId of readNumberArray(
		dump.responsesByPath.get('/v1/home/get_home')
			?.finished_simple_tutorial_list,
	)) {
		setTutorialCompletion(tutorial, tutorialId, true);
		applied = true;
	}
	return applied;
}

function applyContentReleaseEffectsFromDump(
	state: ServerState,
	playerId: string,
	events: readonly OfficialApiDumpEvent[],
): boolean {
	let applied = false;
	for (const event of events) {
		if (
			event.path !== '/v1/user/set_contents_release_effect_history' ||
			event.response === null ||
			!isSuccessfulStatus(event)
		) {
			continue;
		}
		const contentsId = readNumber(event.response.contents_id);
		if (contentsId !== null) {
			state.contentReleaseEffects = setContentReleaseEffectHistory(
				state.contentReleaseEffects,
				playerId,
				contentsId,
			);
			applied = true;
		}
	}
	return applied;
}

function isSuccessfulStatus(event: OfficialApiDumpEvent): boolean {
	return (
		event.statusCode === null ||
		(event.statusCode >= 200 && event.statusCode < 400)
	);
}
