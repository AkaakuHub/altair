import type { BeginnerMissionCategoryMaster } from './beginner-mission-master.ts';
import {
	findBeginnerMissionProgress,
	markBeginnerMissionProgressReceived,
} from './beginner-mission-progress-state.ts';
import type {
	BeginnerMissionProgressState,
	UserBeginnerMissionState,
} from './beginner-mission-types.ts';
import type { EntityIdentityFingerprint } from './entity-provenance.ts';
import { isSameEntityIdentity } from './entity-provenance.ts';

export function receiveBeginnerMissionReward(
	mission: UserBeginnerMissionState,
	missionId: number,
	identityFingerprint?: EntityIdentityFingerprint,
): number | undefined {
	if (mission.receivedMissionIds.includes(missionId)) return undefined;
	const progress = findBeginnerMissionProgress(
		mission,
		missionId,
		identityFingerprint,
	);
	if (!isClaimableMissionProgress(progress)) return undefined;
	markBeginnerMissionProgressReceived(mission, progress);
	return progress.missionId;
}

export function receiveBeginnerMissionRewards(
	mission: UserBeginnerMissionState,
	missionType: number,
	missionCategories: readonly BeginnerMissionCategoryMaster[],
): { mission_id_list: number[] } | undefined {
	const category = missionCategories.find(
		(entry) => entry.missionType === missionType,
	);
	if (!category) return undefined;
	const missionIds = category.missionList
		.filter((entry) => !mission.receivedMissionIds.includes(entry.missionId))
		.map((entry) =>
			findBeginnerMissionProgress(
				mission,
				entry.missionId,
				entry.identityFingerprint,
			),
		)
		.filter(isClaimableMissionProgress)
		.map((progress) => progress.missionId);
	for (const missionId of missionIds) {
		const master = category.missionList.find(
			(entry) => entry.missionId === missionId,
		);
		const progress = findBeginnerMissionProgress(
			mission,
			missionId,
			master?.identityFingerprint,
		);
		if (progress) markBeginnerMissionProgressReceived(mission, progress);
	}
	return { mission_id_list: missionIds };
}

export function receiveBeginnerMissionBannerReward(
	mission: UserBeginnerMissionState,
	missionType: number,
	missionCategories: readonly BeginnerMissionCategoryMaster[],
	sourceMasterReleaseId?: string,
): number | undefined {
	const category = missionCategories.find(
		(entry) => entry.missionType === missionType,
	);
	if (!category || category.missionList.length === 0) return undefined;
	if (isBeginnerMissionTypeReceived(mission, category)) return undefined;
	const isAllReceived = category.missionList.every((entry) => {
		const progress = findBeginnerMissionProgress(
			mission,
			entry.missionId,
			entry.identityFingerprint,
		);
		return progress?.status === 2;
	});
	if (!isAllReceived) return undefined;
	if (
		sourceMasterReleaseId !== undefined &&
		category.identityFingerprint !== undefined
	) {
		mission.receivedMissionTypeProgresses = [
			...(mission.receivedMissionTypeProgresses ?? []),
			{
				missionType,
				sourceMasterReleaseId,
				identityFingerprint: category.identityFingerprint,
			},
		];
	} else {
		mission.receivedMissionTypes = [
			...mission.receivedMissionTypes,
			missionType,
		];
	}
	return missionType;
}

export function isBeginnerMissionTypeReceived(
	mission: UserBeginnerMissionState,
	category: BeginnerMissionCategoryMaster,
): boolean {
	if (category.identityFingerprint === undefined) {
		return mission.receivedMissionTypes.includes(category.missionType);
	}
	const targetIdentityFingerprint = category.identityFingerprint;
	const versioned = (mission.receivedMissionTypeProgresses ?? []).filter(
		(received) => received.missionType === category.missionType,
	);
	const exact = versioned.some((received) =>
		isSameEntityIdentity(
			received.identityFingerprint,
			targetIdentityFingerprint,
		),
	);
	return exact || mission.receivedMissionTypes.includes(category.missionType);
}

function isClaimableMissionProgress(
	value: BeginnerMissionProgressState | undefined,
): value is BeginnerMissionProgressState {
	return value?.status === 1;
}
