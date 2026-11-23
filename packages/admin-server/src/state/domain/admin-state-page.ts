export type AdminStatePage =
	| 'activity-record'
	| 'all'
	| 'extension'
	| 'archive'
	| 'cards'
	| 'circle'
	| 'gacha'
	| 'gacha-server'
	| 'grade-live'
	| 'grand-prix'
	| 'items'
	| 'login-bonus'
	| 'login-bonus-server'
	| 'missions'
	| 'overview'
	| 'present-box'
	| 'quest'
	| 'social'
	| 'stickers'
	| 'user-status'
	| 'users';

export function parseAdminStatePage(value: string | undefined): AdminStatePage {
	switch (value) {
		case 'activity-record':
		case 'all':
		case 'archive':
		case 'cards':
		case 'circle':
		case 'gacha':
		case 'gacha-server':
		case 'grade-live':
		case 'grand-prix':
		case 'items':
		case 'login-bonus':
		case 'login-bonus-server':
		case 'missions':
		case 'overview':
		case 'present-box':
		case 'quest':
		case 'social':
		case 'stickers':
		case 'user-status':
		case 'users':
			return value;
		default:
			return 'overview';
	}
}
