import type { en } from './en.ts';

export const zhCN = {
	reports: '举报',
	reporter: '举报人',
	target: '被举报人',
	reportType: '举报类型',
	saveReport: '保存举报',
	noReports: '暂无举报',
	searchReports: '搜索举报',
	muteList: '屏蔽列表',
	noMutes: '暂无屏蔽用户',
	searchMutes: '搜索屏蔽用户',
	mutedPlayer: '被屏蔽用户',
	deleteReport: (reporter: string, target: string) =>
		`删除${reporter}对${target}的举报`,
} satisfies typeof en;
