import type { UserLearningMusicMasteryState } from './user-learning-music-state.ts';
import { ensureLegacyUserLearningMusicMastery } from './user-learning-music-state.ts';
import type { UserLiveState } from './user-live-state.ts';

const initiallyLockedMusicIds = [
	103201, 103202, 103203, 103204, 103301, 103302, 104201, 104202, 104203,
	104204, 104301, 104302, 203201, 203202, 203203, 203204, 203205, 203206,
	203207, 203301, 203302, 204201, 204202, 204302, 205201, 205202, 205203,
	205301, 303201, 303202, 303203, 303204, 303205, 303206, 304201, 304203,
	304301, 405201, 405202, 405203, 405204, 405205, 405206, 405207, 405208,
	405209, 405301, 405302, 405303, 405304, 405305,
];

export function initializeLearningMusicState(userLive: UserLiveState): void {
	for (const musicId of initiallyLockedMusicIds) {
		ensureLegacyUserLearningMusicMastery(
			userLive,
			initiallyLockedLearningMusicMastery(musicId),
		);
	}
}

function initiallyLockedLearningMusicMastery(
	musicId: number,
): UserLearningMusicMasteryState {
	return {
		musicId,
		musicExpLevel: 0,
		earnedMusicExp: 0,
		isMastery: false,
	};
}
