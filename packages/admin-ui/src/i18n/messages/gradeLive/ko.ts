import type { en } from './en.ts';

export const ko = {
	challenge: '그레이드 챌린지',
	seasonId: '시즌 ID',
	generation: '기수',
	season: '시즌',
	giveGrade: '획득 그레이드',
	rankingPrize: '순위 보상',
	open: '활성화',
	closed: '비활성화',
	noSeasons: '시즌이 없습니다',
	searchSeasons: '시즌 검색',
	saveTitle: (title: string) => `${title} 저장`,
	seasons: (title: string) => `${title} 시즌`,
} satisfies typeof en;
