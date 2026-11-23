export const ko = {
	httpFailure: (status: number, message: string) =>
		`관리 작업에 실패했습니다(HTTP${status}). ${message}`,
	reloadFailure: (committed: string, message: string) =>
		`${committed} 최신 상태를 불러오는 작업도 실패했습니다. ${message}`,
	quantity: (minimum: number, maximum: number) =>
		`수량은 ${minimum}부터 ${maximum} 사이의 정수로 입력해 주세요.`,
	stars: '별 개수를 0 이상의 정수로 입력해 주세요.',
	required: (label: string) => `${label}을(를) 입력해 주세요.`,
	number: (label: string) => `${label}에 숫자를 입력해 주세요.`,
	integer: (label: string) => `${label}에 유효한 정수를 입력해 주세요.`,
	dateTime: '올바른 날짜와 시간을 입력해 주세요.',
	localTime: '지정한 현지 시간을 사용할 수 없습니다.',
	savedDateTime: '저장된 날짜와 시간을 읽을 수 없습니다.',
};
