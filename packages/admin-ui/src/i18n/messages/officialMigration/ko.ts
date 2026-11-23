import type { en } from './en.ts';

export const ko = {
	dumpFile: '덤프 파일',
	selectZip: '덤프 ZIP 선택',
	password: 'LinkLike ID 비밀번호(선택)',
	preview: '미리 보기',
	applyErrors: '적용 오류',
	noCategories: '마이그레이션 항목이 없습니다',
	playerId: '플레이어 ID',
	format: '형식',
	events: '이벤트 수',
	endpoint: '엔드포인트',
	responses: '응답 수',
	captured: '저장됨',
	missing: '저장되지 않음',
	not_applied: '적용 대상 아님',
	selectedZip: (name: string) => `덤프 ZIP 선택: ${name}`,
	applied: (playerId: string, categories: string) =>
		`플레이어 ${playerId}에 적용했습니다. 항목: ${categories}`,
} satisfies typeof en;
