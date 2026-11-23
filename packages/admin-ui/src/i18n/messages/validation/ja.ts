export const ja = {
	httpFailure: (status: number, message: string) =>
		`管理操作に失敗しました（HTTP${status}）。${message}`,
	reloadFailure: (committed: string, message: string) =>
		`${committed} 最新状態の取得にも失敗しました。${message}`,
	quantity: (minimum: number, maximum: number) =>
		`Quantityは${minimum}〜${maximum}の整数で入力してください。`,
	stars: '星の数を0以上の整数で入力してください。',
	required: (label: string) => `${label}を入力してください。`,
	number: (label: string) => `${label}を数値で入力してください。`,
	integer: (label: string) => `${label}を有効な整数で入力してください。`,
	dateTime: '日時を正しく入力してください。',
	localTime: '指定した現地時刻を使用できません。',
	savedDateTime: '保存済みの日時を読み取れません。',
};
