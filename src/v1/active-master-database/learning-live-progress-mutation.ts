import type { Database } from 'bun:sqlite';
import { requireMusicProvenance } from '../../master-data/music-identity.ts';
import {
	ensureUserLearningMusicMastery,
	saveUserLearningMusicMastery,
	type UserLearningMusicMasteryState,
} from '../../state/user-learning-music-state.ts';
import type { UserLiveState } from '../../state/user-live-state.ts';

export function getUserLearningMusicMastery(
	database: Database,
	masterReleaseId: string,
	userLive: UserLiveState,
	musicId: number,
): UserLearningMusicMasteryState {
	return ensureUserLearningMusicMastery(
		userLive,
		{ musicId, musicExpLevel: 1, earnedMusicExp: 0, isMastery: true },
		requireMusicProvenance(database, masterReleaseId, musicId),
	);
}
export function saveMasterReleaseLearningMusicMastery(
	database: Database,
	masterReleaseId: string,
	userLive: UserLiveState,
	mastery: UserLearningMusicMasteryState,
): void {
	saveUserLearningMusicMastery(
		userLive,
		mastery,
		requireMusicProvenance(database, masterReleaseId, mastery.musicId),
	);
}
