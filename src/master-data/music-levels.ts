import type { Database } from 'bun:sqlite';

type MusicLevelBoundary = {
	level: number;
	experience: number;
	cumulativeExperience: number;
};

const defaultExperienceType = 1;
const minMusicLevel = 1;
const maxMusicLevel = 50;

type MusicLevelRow = {
	level: number;
	experience: number;
	cumulative_experience: number;
};

export function getMusicLevelTableFromDatabase(
	database: Database,
): MusicLevelBoundary[] {
	const rows = database
		.query(
			[
				'SELECT level, experience, cumulative_experience',
				'FROM master_music_levels',
				'WHERE experience_type = ?',
				'ORDER BY level',
			].join(' '),
		)
		.all(defaultExperienceType) as MusicLevelRow[];
	return [
		{ level: 1, experience: 0, cumulativeExperience: 0 },
		...rows.map((row) => ({
			level: row.level,
			experience: row.experience,
			cumulativeExperience: row.cumulative_experience,
		})),
	];
}

export function musicLevelForEarnedExperienceFromDatabase(
	database: Database,
	earnedMusicExp: number,
): number {
	const normalizedExp = Math.max(0, Math.trunc(earnedMusicExp));
	let level = minMusicLevel;
	for (const boundary of getMusicLevelTableFromDatabase(database)) {
		if (boundary.cumulativeExperience > normalizedExp) {
			break;
		}
		level = boundary.level;
	}
	return Math.min(level, maxMusicLevel);
}
