import type { EntityIdentityFingerprint } from '../state/entity-provenance.ts';
import type { ProfileUserProgressStats } from '../state/profile-stats-master.ts';
import { findCompatibleGradeQuestProgress } from '../state/user-grade-quest-state.ts';
import type { UserLiveState } from '../state/user-live-state.ts';
import { isQuestStageProgressCompatible } from '../state/user-quest-progress-compatibility.ts';

export function projectProfileUserProgressStats(
	live: UserLiveState,
	support: {
		musicIds: ReadonlySet<number>;
		standardStageFingerprints: ReadonlyMap<number, EntityIdentityFingerprint>;
		gradeSeriesFingerprints: ReadonlyMap<number, EntityIdentityFingerprint>;
	},
): ProfileUserProgressStats {
	return {
		musicNum: live.learningMusicMasteries.filter((mastery) =>
			support.musicIds.has(mastery.musicId),
		).length,
		standardLiveClearNum: live.questStageProgressList.filter(
			(progress) =>
				progress.questLiveType === 1 &&
				progress.playCount > 0 &&
				support.standardStageFingerprints.has(progress.stageId) &&
				isQuestStageProgressCompatible(
					progress,
					support.standardStageFingerprints.get(progress.stageId),
				),
		).length,
		gradeLiveClearNum: [...support.gradeSeriesFingerprints].filter(
			([seriesId, fingerprint]) =>
				(findCompatibleGradeQuestProgress(
					live.gradeQuestProgressList,
					seriesId,
					fingerprint,
				)?.clearStatus ?? 0) > 0,
		).length,
	};
}
