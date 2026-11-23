import type { en } from './en.ts';

export const ko = {
	activeState: '활성 로그인 보너스 수령 현황',
	noActiveBonus: '활성 로그인 보너스가 없습니다',
	days: '일수',
	receivedToday: '오늘 수령 완료',
	receivedCount: '수령 횟수',
	selectedBonus: '선택한 보너스',
	noReward: '보상이 없습니다',
	day: '일차',
	pending: '미수령',
	rewardType: '보상 종류',
	rewardId: '보상 ID',
	noBonus: '로그인 보너스가 없습니다',
	unavailable:
		'선택한 로그인 보너스가 현재 활성화되어 있지 않습니다. 입력은 유지됩니다. 보너스를 선택해 주세요.',
	progressSummary: (received: string, total: number) =>
		`${total}일 중 ${received}일`,
} satisfies typeof en;
