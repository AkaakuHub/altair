import type { en } from './en.ts';

export const ko = {
	activeId: '진행할 그랑프리 ID',
	dailyPlayableCount: '일일 플레이 가능 횟수',
	save: '그랑프리 저장',
	guildTotalPoint: '서클 총 포인트',
	guildRanking: '서클 순위',
	withinGuildRanking: '서클 내 순위',
	personalTotalPoint: '개인 총 포인트',
	personalRanking: '개인 순위',
	search: '그랑프리 검색',
	noEntries: '라이브 그랑프리가 없습니다',
	id: '그랑프리 ID',
	quests: '퀘스트',
	stages: '스테이지',
	rewards: '보상',
	setActive: '활성화',
	rhythmSeries: '리듬 게임 시리즈',
	questStages: '퀘스트 스테이지',
	noStages: '퀘스트 스테이지가 없습니다',
	originalMusic: '원래 곡',
	resetMusic: '원래 곡으로 복원',
	open: '개최 중',
	results: '결과 확인',
	closed: '종료',
	seriesLabel: (order: number, id: number) => `${order}. 시리즈 ${id}`,
	unresolved: (value: string) => `미해결: ${value}`,
	musicSound: (music: number, sound: number) => `곡 ${music} / 음성 ${sound}`,
	rewardRange: (type: number, min: number, max: number) =>
		`유형 ${type} / ${min}–${max}`,
	rewardItem: (id: number, count: number, type: number) =>
		`아이템 ${id} × ${count} (유형 ${type})`,
	musicReasons: {
		'quest-music-type-unresolved': '퀘스트 곡 유형이 미해결 상태입니다',
		'music-master-missing': '곡 마스터가 없습니다',
	},
} satisfies typeof en;
