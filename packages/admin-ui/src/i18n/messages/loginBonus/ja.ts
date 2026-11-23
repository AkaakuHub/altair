import type { en } from './en.ts';

export const ja = {
	activeState: '有効なログインボーナスの受取状況',
	noActiveBonus: '有効なログインボーナスがありません',
	days: '日数',
	receivedToday: '本日受取済み',
	receivedCount: '受取回数',
	selectedBonus: '選択中のボーナス',
	noReward: '報酬がありません',
	day: '日目',
	pending: '未受取',
	rewardType: '報酬の種別',
	rewardId: '報酬ID',
	noBonus: 'ログインボーナスがありません',
	unavailable:
		'選択したログインボーナスは現在有効ではありません。入力は保持しています。対象を選択してください。',
	progressSummary: (received: string, total: number) =>
		`${total}日中${received}日`,
} satisfies typeof en;
