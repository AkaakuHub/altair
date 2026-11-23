import type { EntityIdentityFingerprint } from '../state/entity-provenance.ts';

export function createMissionIdentityFingerprint(source: {
	missionId: number;
	missionType: number;
	transitionContentsId: number;
}): EntityIdentityFingerprint {
	return {
		domain: 'mission',
		value: JSON.stringify([
			source.missionId,
			source.missionType,
			source.transitionContentsId,
		]),
	};
}

export function createBeginnerMissionIdentityFingerprint(source: {
	missionId: number;
	missionType: number;
	conditionType: number;
	conditionDetail: number;
	transitionContentsId: number;
}): EntityIdentityFingerprint {
	return {
		domain: 'beginner-mission',
		value: JSON.stringify([
			source.missionId,
			source.missionType,
			source.conditionType,
			source.conditionDetail,
			source.transitionContentsId,
		]),
	};
}

export function createBeginnerMissionCategoryIdentityFingerprint(
	missionType: number,
	missionFingerprints: readonly EntityIdentityFingerprint[],
): EntityIdentityFingerprint {
	return {
		domain: 'beginner-mission-category',
		value: JSON.stringify([
			missionType,
			missionFingerprints.map((fingerprint) => fingerprint.value).sort(),
		]),
	};
}

export function createCommonMissionRewardIdentityFingerprint(source: {
	commonMissionId: number;
	orderId: number;
}): EntityIdentityFingerprint {
	return {
		domain: 'common-mission-reward',
		value: JSON.stringify([source.commonMissionId, source.orderId]),
	};
}
