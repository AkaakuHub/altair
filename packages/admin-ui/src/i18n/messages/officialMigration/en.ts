export const en = {
	dumpFile: 'Dump file',
	selectZip: 'Select dump ZIP',
	password: 'LinkLike ID password (optional)',
	preview: 'Preview',
	applyErrors: 'Apply errors',
	noCategories: 'No migration categories',
	playerId: 'Player ID',
	format: 'Format',
	events: 'Events',
	endpoint: 'Endpoint',
	responses: 'Responses',
	captured: 'Captured',
	missing: 'Missing',
	not_applied: 'Not applied',
	selectedZip: (name: string) => `Select dump ZIP: ${name}`,
	applied: (playerId: string, categories: string) =>
		`Applied player ${playerId}. Categories: ${categories}`,
};
