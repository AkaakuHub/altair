import type { en } from './en.ts';

export const ja = {
	challenge: 'グレードチャレンジ',
	seasonId: 'シーズンID',
	generation: '期',
	season: 'シーズン',
	giveGrade: '獲得グレード',
	rankingPrize: '順位報酬',
	open: '開催する',
	closed: '開催しない',
	noSeasons: 'シーズンがありません',
	searchSeasons: 'シーズンを検索',
	saveTitle: (title: string) => `${title}を保存`,
	seasons: (title: string) => `${title}のシーズン`,
} satisfies typeof en;
