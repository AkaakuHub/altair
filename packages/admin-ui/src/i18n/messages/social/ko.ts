import type { en } from './en.ts';

export const ko = {
	reports: '신고',
	reporter: '신고자',
	target: '대상자',
	reportType: '신고 유형',
	saveReport: '신고 저장',
	noReports: '신고가 없습니다',
	searchReports: '신고 검색',
	muteList: '뮤트 목록',
	noMutes: '뮤트한 사용자가 없습니다',
	searchMutes: '뮤트 검색',
	mutedPlayer: '뮤트 대상자',
	deleteReport: (reporter: string, target: string) =>
		`${reporter}님의 ${target}님에 대한 신고 삭제`,
} satisfies typeof en;
