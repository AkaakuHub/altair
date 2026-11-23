import type {
	BeginnerMissionEntry,
	MissionCatalogEntry,
} from '@altair/runtime/admin/dto/admin-seed-schema.ts';
import type {
	AdminChapterMissionProgress,
	AdminUserBeginnerMission,
	AdminUserMission,
	AdminUserStepUpBeginnerMission,
} from '@altair/runtime/admin/dto/admin-visible-state-schema.ts';
import {
	findBeginnerMissionProgress,
	findMissionProgress,
	findStepUpBeginnerMission,
	isDerivedMission,
} from './mission-model.ts';

export type CommonMissionRow = {
	missionId: number;
	name: string;
	conditionAchieveNum: number;
	transitionContentsId: number;
	achievedNum: number;
	isAchieved: boolean;
	isDerived: boolean;
};

type BeginnerMissionRow = {
	missionId: number;
	name: string;
	conditionAchieveNum: number;
	transitionContentsId: number;
	achievedNum: number;
	status: number;
};

type StepUpBeginnerMissionRow = {
	missionId: number;
	achievedNum: number;
	isAchieved: boolean;
	isReceived: boolean;
};

export function createCommonMissionRows(
	rows: MissionCatalogEntry[],
	fullCatalog: MissionCatalogEntry[],
	mission: AdminUserMission | undefined,
): CommonMissionRow[] {
	return rows.map((row) => {
		const progress = findMissionProgress(mission, row.missionId);
		return {
			missionId: row.missionId,
			name: row.name,
			conditionAchieveNum: row.conditionAchieveNum,
			transitionContentsId: row.transitionContentsId,
			achievedNum: progress?.achievedNum ?? 0,
			isAchieved: progress?.isAchieved ?? false,
			isDerived: isDerivedMission(fullCatalog, row.missionId),
		};
	});
}

export function createBeginnerMissionRows(
	catalog: BeginnerMissionEntry[],
	mission: AdminUserBeginnerMission | undefined,
): BeginnerMissionRow[] {
	return catalog.map((row) => {
		const progress = findBeginnerMissionProgress(mission, row.missionId);
		return {
			missionId: row.missionId,
			name: row.name,
			conditionAchieveNum: row.conditionAchieveNum,
			transitionContentsId: row.transitionContentsId,
			achievedNum: progress?.achievedNum ?? 0,
			status: progress?.status ?? 0,
		};
	});
}

export function createStepUpBeginnerMissionRows(
	catalog: Array<{ missionId: number }>,
	mission: AdminUserStepUpBeginnerMission | undefined,
): StepUpBeginnerMissionRow[] {
	return catalog.map((row) => {
		const progress = findStepUpBeginnerMission(mission, row.missionId);
		return {
			missionId: row.missionId,
			achievedNum: progress?.achievedNum ?? 0,
			isAchieved: progress?.isAchieved ?? false,
			isReceived: progress?.isReceived ?? false,
		};
	});
}

export function filterCommonMissionRows(
	missions: CommonMissionRow[],
	query: string,
): CommonMissionRow[] {
	return filterRows(missions, query, (mission) =>
		`${mission.missionId} ${mission.name} ${mission.conditionAchieveNum} ${mission.transitionContentsId}`.toLowerCase(),
	);
}

export function filterBeginnerMissionRows(
	missions: BeginnerMissionRow[],
	query: string,
): BeginnerMissionRow[] {
	return filterRows(missions, query, (mission) =>
		`${mission.missionId} ${mission.name} ${mission.conditionAchieveNum} ${mission.transitionContentsId}`.toLowerCase(),
	);
}

export function filterStepUpBeginnerMissionRows(
	missions: StepUpBeginnerMissionRow[],
	query: string,
): StepUpBeginnerMissionRow[] {
	return filterRows(missions, query, (mission) => String(mission.missionId));
}

export function filterChapterMissionRows(
	missions: AdminChapterMissionProgress[],
	query: string,
): AdminChapterMissionProgress[] {
	return filterRows(missions, query, (mission) =>
		`${mission.missionId} ${mission.achievedNum} ${mission.isAchieved} ${mission.isReceived}`.toLowerCase(),
	);
}

function filterRows<Row>(
	rows: Row[],
	query: string,
	searchText: (row: Row) => string,
): Row[] {
	const normalized = query.trim().toLowerCase();
	if (normalized.length === 0) {
		return rows;
	}
	return rows.filter((row) => searchText(row).includes(normalized));
}
