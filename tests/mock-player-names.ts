export const mockPlayerNames = [
	'kozue',
	'tsuzuri',
	'megumi',
	'kaho',
	'sayaka',
	'rurino',
	'ginko',
	'kosuzu',
	'hime',
	'ceras',
	'izumi',
] as const;

export type MockPlayerName = (typeof mockPlayerNames)[number];
