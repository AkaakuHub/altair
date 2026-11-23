import type { en } from './en.ts';

export const zhCN = {
	activeState: '有效登录奖励领取情况',
	noActiveBonus: '没有有效的登录奖励',
	days: '天数',
	receivedToday: '今日已领取',
	receivedCount: '领取次数',
	selectedBonus: '所选奖励',
	noReward: '没有奖励',
	day: '天数',
	pending: '未领取',
	rewardType: '奖励类型',
	rewardId: '奖励ID',
	noBonus: '没有登录奖励',
	unavailable: '所选登录奖励目前未启用。已保留您的输入，请选择奖励。',
	progressSummary: (received: string, total: number) =>
		`已领取${received}天，共${total}天`,
} satisfies typeof en;
