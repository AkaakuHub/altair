import type {
	EntityIdentityFingerprint,
	EntityProvenance,
} from './entity-provenance.ts';
import { findCompatibleMasterBoundProgress } from './master-bound-progress.ts';
import type {
	UserRhythmGameStateOwner,
	UserRhythmMusicScoreState,
} from './user-rhythm-game-types.ts';

const empty = (musicId: number): UserRhythmMusicScoreState => ({
	musicId,
	highScore: 0,
	highScoreAchievementStatus: 0,
	clearCount: 0,
	totalScoreAccumulated: 0,
	musicMasteryLevel: 1,
	musicMasteryExperience: 0,
	difficultyScores: [],
});
export function findUserRhythmMusicScore(
	owner: UserRhythmGameStateOwner,
	musicId: number,
	fingerprint: EntityIdentityFingerprint,
): UserRhythmMusicScoreState {
	return (
		findCompatibleMasterBoundProgress(
			owner.rhythmMusicScores,
			(score) => score.musicId === musicId,
			fingerprint,
		) ?? empty(musicId)
	);
}
export function saveUserRhythmMusicScore(
	owner: UserRhythmGameStateOwner,
	score: UserRhythmMusicScoreState,
	provenance: EntityProvenance,
): void {
	owner.rhythmMusicScores = [
		...owner.rhythmMusicScores.filter(
			(current) =>
				current.musicId !== score.musicId ||
				current.identityFingerprint?.domain !==
					provenance.identityFingerprint.domain ||
				current.identityFingerprint.value !==
					provenance.identityFingerprint.value,
		),
		{ ...score, ...provenance },
	];
}
export function findLegacyUserRhythmMusicScore(
	owner: UserRhythmGameStateOwner,
	musicId: number,
): UserRhythmMusicScoreState {
	return (
		owner.rhythmMusicScores.find(
			(score) =>
				score.musicId === musicId && score.identityFingerprint === undefined,
		) ?? empty(musicId)
	);
}
export function saveLegacyUserRhythmMusicScore(
	owner: UserRhythmGameStateOwner,
	score: UserRhythmMusicScoreState,
): void {
	owner.rhythmMusicScores = [
		...owner.rhythmMusicScores.filter(
			(current) =>
				current.musicId !== score.musicId ||
				current.identityFingerprint !== undefined,
		),
		{
			musicId: score.musicId,
			highScore: score.highScore,
			highScoreAchievementStatus: score.highScoreAchievementStatus,
			clearCount: score.clearCount,
			totalScoreAccumulated: score.totalScoreAccumulated,
			musicMasteryLevel: score.musicMasteryLevel,
			musicMasteryExperience: score.musicMasteryExperience,
			difficultyScores: score.difficultyScores,
		},
	];
}
