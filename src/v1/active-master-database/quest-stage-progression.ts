import type { EntityIdentityFingerprint } from '../../state/entity-provenance.ts';
import type { UserLiveState } from '../../state/user-live-state.ts';
import type { UserQuestStageProgressState } from '../../state/user-quest-progress-types.ts';
import { findUserQuestStageProgress } from '../../state/user-standard-quest-progress.ts';

export function questClearStatus(
	progress: UserQuestStageProgressState,
): number {
	return progress.playCount > 0 ? 3 : 0;
}

export function sequentialStageStates<T extends { stage_id: number }>(
	rows: T[],
	userLive: UserLiveState,
	questLiveType: number,
	resolveIdentityFingerprint?: (
		stageId: number,
	) => EntityIdentityFingerprint | undefined,
): Array<{
	row: T;
	progress: UserQuestStageProgressState;
	isLock: boolean;
}> {
	return rows.map((row, index) => {
		const identityFingerprint = resolveIdentityFingerprint?.(row.stage_id);
		const progress = findUserQuestStageProgress(
			userLive,
			questLiveType,
			row.stage_id,
			identityFingerprint,
		);
		const previousRow = rows[index - 1];
		const previousProgress =
			previousRow === undefined
				? undefined
				: findUserQuestStageProgress(
						userLive,
						questLiveType,
						previousRow.stage_id,
						resolveIdentityFingerprint?.(previousRow.stage_id),
					);
		return {
			row,
			progress,
			isLock: index > 0 && (previousProgress?.playCount ?? 0) === 0,
		};
	});
}
