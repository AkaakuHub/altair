import type { en } from './en.ts';

export const ja = {
	reports: '通報',
	reporter: '通報者',
	target: '対象者',
	reportType: '通報種別',
	saveReport: '通報を保存',
	noReports: '通報がありません',
	searchReports: '通報を検索',
	muteList: 'ミュート一覧',
	noMutes: 'ミュートしているユーザーがいません',
	searchMutes: 'ミュートを検索',
	mutedPlayer: 'ミュート対象者',
	deleteReport: (reporter: string, target: string) =>
		`${reporter}から${target}への通報を削除`,
} satisfies typeof en;
