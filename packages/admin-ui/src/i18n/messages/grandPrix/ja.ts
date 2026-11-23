import type { en } from './en.ts';

export const ja = {
	activeId: '開催するグランプリID',
	dailyPlayableCount: '1日のプレイ可能回数',
	save: 'グランプリを保存',
	guildTotalPoint: 'サークル合計ポイント',
	guildRanking: 'サークル順位',
	withinGuildRanking: 'サークル内順位',
	personalTotalPoint: '個人合計ポイント',
	personalRanking: '個人順位',
	search: 'グランプリを検索',
	noEntries: 'ライブグランプリがありません',
	id: 'グランプリID',
	quests: 'クエスト',
	stages: 'ステージ',
	rewards: '報酬',
	setActive: '有効にする',
	rhythmSeries: 'リズムゲームのシリーズ',
	questStages: 'クエストのステージ',
	noStages: 'クエストのステージがありません',
	originalMusic: '元の楽曲',
	resetMusic: '元の楽曲に戻す',
	open: '開催中',
	results: '結果確認',
	closed: '閉鎖中',
	seriesLabel: (order: number, id: number) => `${order}．シリーズ${id}`,
	unresolved: (value: string) => `未解決：${value}`,
	musicSound: (music: number, sound: number) => `楽曲${music}／音声${sound}`,
	rewardRange: (type: number, min: number, max: number) =>
		`種別${type}／${min}～${max}`,
	rewardItem: (id: number, count: number, type: number) =>
		`アイテム${id} × ${count}（種別${type}）`,
	musicReasons: {
		'quest-music-type-unresolved': 'クエストの楽曲種別が未解決です',
		'music-master-missing': '楽曲マスターがありません',
	},
} satisfies typeof en;
