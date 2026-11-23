import type {
	BeginnerMissionCategoryMaster,
	BeginnerMissionMaster,
} from './beginner-mission-master.ts';
import type {
	BeginnerMissionProgressState,
	BeginnerMissionStatus,
	UserBeginnerMissionState,
} from './beginner-mission-types.ts';
import type { EntityIdentityFingerprint } from './entity-provenance.ts';
import { findCompatibleMasterBoundProgress } from './master-bound-progress.ts';

type BeginnerMissionAchievedNumResolver = (
	mission: BeginnerMissionMaster,
) => number | undefined;

export function setBeginnerMissionProgress(
	mission: UserBeginnerMissionState,
	missionId: number,
	achievedNum: number,
	status: BeginnerMissionStatus,
	provenance?: {
		sourceMasterReleaseId: string;
		identityFingerprint: EntityIdentityFingerprint;
	},
): boolean {
	if (!Number.isSafeInteger(missionId) || missionId <= 0) return false;
	if (!Number.isSafeInteger(achievedNum) || achievedNum < 0) return false;
	if (provenance === undefined) {
		return setBeginnerMissionStatus(mission, missionId, achievedNum, status);
	}
	const progress = ensureBeginnerMissionProgress(
		mission,
		missionId,
		provenance.identityFingerprint,
		provenance.sourceMasterReleaseId,
	);
	progress.achievedNum = achievedNum;
	progress.status = status;
	return true;
}

export function incrementBeginnerMissionProgressByTransition(
	mission: UserBeginnerMissionState,
	missionCategories: readonly BeginnerMissionCategoryMaster[],
	transitionContentsId: number,
	amount: number,
	sourceMasterReleaseId?: string,
): boolean {
	if (
		!Number.isSafeInteger(transitionContentsId) ||
		transitionContentsId <= 0 ||
		!Number.isSafeInteger(amount) ||
		amount <= 0
	) {
		return false;
	}
	let updated = false;
	for (const masterMission of missionCategories.flatMap(
		(category) => category.missionList,
	)) {
		if (masterMission.transitionContentsId !== transitionContentsId) continue;
		const progress = ensureBeginnerMissionProgress(
			mission,
			masterMission.missionId,
			masterMission.identityFingerprint,
			sourceMasterReleaseId,
		);
		progress.achievedNum = Math.min(
			masterMission.conditionAchieveNum,
			progress.achievedNum + amount,
		);
		if (progress.status !== 2) {
			progress.status =
				progress.achievedNum >= masterMission.conditionAchieveNum ? 1 : 0;
		}
		updated = true;
	}
	return updated;
}

export function syncBeginnerMissionProgressByCondition(
	mission: UserBeginnerMissionState,
	missionCategories: readonly BeginnerMissionCategoryMaster[],
	resolveAchievedNum: BeginnerMissionAchievedNumResolver,
	sourceMasterReleaseId?: string,
): boolean {
	let updated = false;
	for (const masterMission of missionCategories.flatMap(
		(category) => category.missionList,
	)) {
		const achievedNum = resolveAchievedNum(masterMission);
		if (achievedNum === undefined) continue;
		updated =
			setMissionProgressFromAchievedNum(
				mission,
				masterMission.missionId,
				Math.min(masterMission.conditionAchieveNum, achievedNum),
				masterMission.conditionAchieveNum,
				masterMission.identityFingerprint,
				sourceMasterReleaseId,
			) || updated;
	}
	return updated;
}

export function findBeginnerMissionProgress(
	mission: UserBeginnerMissionState,
	missionId: number,
	identityFingerprint?: EntityIdentityFingerprint,
): BeginnerMissionProgressState | undefined {
	if (identityFingerprint !== undefined) {
		return findCompatibleMasterBoundProgress(
			mission.missionProgresses,
			(progress) => progress.missionId === missionId,
			identityFingerprint,
		);
	}
	return mission.missionProgresses.find(
		(progress) => progress.missionId === missionId,
	);
}

export function markBeginnerMissionProgressReceived(
	mission: UserBeginnerMissionState,
	progress: BeginnerMissionProgressState,
): void {
	progress.status = 2;
	if (
		progress.identityFingerprint === undefined &&
		!mission.receivedMissionIds.includes(progress.missionId)
	) {
		mission.receivedMissionIds = [
			...mission.receivedMissionIds,
			progress.missionId,
		];
	}
}

function setBeginnerMissionStatus(
	mission: UserBeginnerMissionState,
	missionId: number,
	achievedNum: number,
	status: BeginnerMissionStatus,
): boolean {
	if (achievedNum === 0 && status === 0) {
		mission.missionProgresses = mission.missionProgresses.filter(
			(progress) => progress.missionId !== missionId,
		);
		mission.receivedMissionIds = mission.receivedMissionIds.filter(
			(receivedMissionId) => receivedMissionId !== missionId,
		);
		return true;
	}
	const progress = ensureBeginnerMissionProgress(mission, missionId);
	progress.achievedNum = achievedNum;
	progress.status = status;
	if (status === 2 && progress.identityFingerprint === undefined) {
		if (!mission.receivedMissionIds.includes(missionId)) {
			mission.receivedMissionIds = [...mission.receivedMissionIds, missionId];
		}
	} else {
		mission.receivedMissionIds = mission.receivedMissionIds.filter(
			(receivedMissionId) => receivedMissionId !== missionId,
		);
	}
	return true;
}

function setMissionProgressFromAchievedNum(
	mission: UserBeginnerMissionState,
	missionId: number,
	achievedNum: number,
	conditionAchieveNum: number,
	identityFingerprint?: EntityIdentityFingerprint,
	sourceMasterReleaseId?: string,
): boolean {
	const existing = findBeginnerMissionProgress(
		mission,
		missionId,
		identityFingerprint,
	);
	const nextStatus =
		existing?.status === 2
			? existing.status
			: achievedNum >= conditionAchieveNum
				? 1
				: 0;
	if (existing === undefined && achievedNum === 0 && nextStatus === 0) {
		return false;
	}
	const progress =
		existing?.identityFingerprint !== undefined ||
		identityFingerprint === undefined
			? (existing ?? ensureBeginnerMissionProgress(mission, missionId))
			: ensureBeginnerMissionProgress(
					mission,
					missionId,
					identityFingerprint,
					sourceMasterReleaseId,
				);
	if (progress.achievedNum === achievedNum && progress.status === nextStatus) {
		return false;
	}
	progress.achievedNum = achievedNum;
	progress.status = nextStatus;
	return true;
}

function ensureBeginnerMissionProgress(
	mission: UserBeginnerMissionState,
	missionId: number,
	identityFingerprint?: EntityIdentityFingerprint,
	sourceMasterReleaseId?: string,
): BeginnerMissionProgressState {
	const existing = findBeginnerMissionProgress(
		mission,
		missionId,
		identityFingerprint,
	);
	if (
		existing !== undefined &&
		(identityFingerprint === undefined ||
			existing.identityFingerprint !== undefined)
	)
		return existing;
	const progress: BeginnerMissionProgressState = {
		missionId,
		...(sourceMasterReleaseId === undefined ? {} : { sourceMasterReleaseId }),
		...(identityFingerprint === undefined ? {} : { identityFingerprint }),
		achievedNum: existing?.achievedNum ?? 0,
		status: existing?.status ?? 0,
	};
	mission.missionProgresses = [...mission.missionProgresses, progress];
	return progress;
}
