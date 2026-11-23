export function query(
	database: { query(sql: string): unknown },
	tableName: string,
): unknown {
	return database.query(`SELECT id FROM ${tableName}`);
}
