import type { en } from './en.ts';

export const zhCN = {
	challenge: '等级挑战',
	seasonId: '赛季ID',
	generation: '期数',
	season: '赛季',
	giveGrade: '授予等级',
	rankingPrize: '排名奖励',
	open: '启用',
	closed: '停用',
	noSeasons: '暂无赛季',
	searchSeasons: '搜索赛季',
	saveTitle: (title: string) => `保存${title}`,
	seasons: (title: string) => `${title}赛季`,
} satisfies typeof en;
