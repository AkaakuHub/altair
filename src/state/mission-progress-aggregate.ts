import type { ServerState } from '../server-state-schema.ts';
import type { EntityIdentityFingerprint } from './entity-provenance.ts';
import { isSameEntityIdentity } from './entity-provenance.ts';
import { findCompatibleMasterBoundProgress } from './master-bound-progress.ts';
import type {
	MissionProgressState,
	UserMissionState,
} from './mission-types.ts';

export function ensureUserMissionState(
	state: ServerState,
	playerId: string,
): UserMissionState {
	const existing = state.userMissions.find(
		(mission) => mission.playerId === playerId,
	);
	if (existing) return existing;
	const mission = createUserMissionState(playerId);
	state.userMissions = [...state.userMissions, mission];
	return mission;
}

export function getMissionProgress(
	mission: UserMissionState,
	missionId: number,
	identityFingerprint?: EntityIdentityFingerprint,
): MissionProgressState | undefined {
	return identityFingerprint === undefined
		? mission.missionProgresses.find(
				(progress) => progress.missionId === missionId,
			)
		: findCompatibleMasterBoundProgress(
				mission.missionProgresses,
				(progress) => progress.missionId === missionId,
				identityFingerprint,
			);
}

export function upsertMissionProgress(
	mission: UserMissionState,
	progress: MissionProgressState,
): void {
	const existing = getMissionProgress(
		mission,
		progress.missionId,
		progress.identityFingerprint,
	);
	if (progress.achievedNum === 0 && !progress.isAchieved) {
		mission.missionProgresses = mission.missionProgresses.filter(
			(entry) => !isSameMissionProgressIdentity(entry, progress),
		);
		return;
	}
	if (existing) {
		if (!isSameMissionProgressIdentity(existing, progress)) {
			mission.missionProgresses = [...mission.missionProgresses, progress];
			return;
		}
		mission.missionProgresses = mission.missionProgresses.map((entry) =>
			entry === existing ? { ...progress } : entry,
		);
		return;
	}
	mission.missionProgresses = [...mission.missionProgresses, progress];
}

function createUserMissionState(playerId: string): UserMissionState {
	return {
		playerId,
		commonMissionInfo: {
			receivedOrder: 0,
			rhythmGameStar: 0,
			schoolStageStar: 0,
		},
		missionProgresses: [],
		dailyMissionGameDate: null,
	};
}

function isSameMissionProgressIdentity(
	current: MissionProgressState,
	progress: MissionProgressState,
): boolean {
	if (current.missionId !== progress.missionId) return false;
	return progress.identityFingerprint === undefined
		? current.identityFingerprint === undefined
		: isSameEntityIdentity(
				current.identityFingerprint,
				progress.identityFingerprint,
			);
}
