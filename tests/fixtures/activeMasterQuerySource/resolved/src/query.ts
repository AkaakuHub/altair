const select = [
	'SELECT id, musics_id',
	'FROM master_music_learning_quest_series',
];

export function query(database: { query(sql: string): unknown }): unknown {
	return database.query([...select, 'ORDER BY id'].join(' '));
}

const ids = [1];

export function mappedSpreadQuery(database: {
	query(sql: string): unknown;
}): unknown {
	return database.query(
		[
			'SELECT id',
			'FROM master_grade_add_skills',
			'ORDER BY CASE id',
			...ids.map((id, index) => `WHEN ${id} THEN ${index}`),
			'END',
		].join(' '),
	);
}
