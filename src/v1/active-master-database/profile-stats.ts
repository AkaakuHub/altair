import type { Database } from 'bun:sqlite';
import { projectProfileUserProgressStats } from '../../application/profile-progress-projection.ts';
import { getGradeQuestSeriesIdentityFingerprints } from '../../master-data/grade-progress-identity.ts';
import { getStandardQuestStageIdentityFingerprints } from '../../master-data/quest-stage-identity.ts';
import type {
	ProfileStatsMaster,
	ProfileUserProgressStats,
} from '../../state/profile-stats-master.ts';
import type { UserLiveState } from '../../state/user-live-state.ts';

type CountRow = {
	count: number;
};

export function getProfileStatsFromDatabase(
	database: Database,
): ProfileStatsMaster {
	return {
		musicMaxNum: readCount(database, 'master_musics'),
		standardLiveMaxNum: readCount(database, 'master_standard_quest_stages'),
		dreamStyleNum: readCount(database, 'master_dream_quest_series'),
	};
}

export function getProfileUserProgressStatsFromDatabase(
	database: Database,
	live: UserLiveState,
): ProfileUserProgressStats {
	const musicIds = readIds(database, 'master_musics');
	const standardStageFingerprints =
		getStandardQuestStageIdentityFingerprints(database);
	const gradeSeriesFingerprints =
		getGradeQuestSeriesIdentityFingerprints(database);
	return projectProfileUserProgressStats(live, {
		musicIds,
		standardStageFingerprints,
		gradeSeriesFingerprints,
	});
}

function readCount(
	database: Database,
	tableName:
		| 'master_musics'
		| 'master_standard_quest_stages'
		| 'master_dream_quest_series',
): number {
	const row = database
		.query<CountRow, []>(`SELECT COUNT(*) AS count FROM ${tableName}`)
		.get();
	if (row === null) {
		throw new Error(`Missing YAML master count: ${tableName}`);
	}
	return row.count;
}

function readIds(database: Database, tableName: 'master_musics'): Set<number> {
	return new Set(
		database
			.query<{ id: number }, []>(`SELECT id FROM ${tableName}`)
			.all()
			.map((row) => row.id),
	);
}
