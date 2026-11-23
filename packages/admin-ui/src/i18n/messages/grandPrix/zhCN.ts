import type { en } from './en.ts';

export const zhCN = {
	activeId: '当前大奖赛ID',
	dailyPlayableCount: '每日可游玩次数',
	save: '保存大奖赛',
	guildTotalPoint: '社团总积分',
	guildRanking: '社团排名',
	withinGuildRanking: '社团内排名',
	personalTotalPoint: '个人总积分',
	personalRanking: '个人排名',
	search: '搜索大奖赛',
	noEntries: '暂无演唱会大奖赛',
	id: '大奖赛ID',
	quests: '任务',
	stages: '关卡',
	rewards: '奖励',
	setActive: '设为当前',
	rhythmSeries: '节奏游戏系列',
	questStages: '任务关卡',
	noStages: '暂无任务关卡',
	originalMusic: '原始歌曲',
	resetMusic: '恢复原始歌曲',
	open: '进行中',
	results: '查看结果',
	closed: '已关闭',
	seriesLabel: (order: number, id: number) => `${order}．系列${id}`,
	unresolved: (value: string) => `未解析：${value}`,
	musicSound: (music: number, sound: number) => `歌曲${music}／音频${sound}`,
	rewardRange: (type: number, min: number, max: number) =>
		`类型${type}／${min}～${max}`,
	rewardItem: (id: number, count: number, type: number) =>
		`道具${id} × ${count}（类型${type}）`,
	musicReasons: {
		'quest-music-type-unresolved': '任务歌曲类型尚未解析',
		'music-master-missing': '缺少歌曲主数据',
	},
} satisfies typeof en;
