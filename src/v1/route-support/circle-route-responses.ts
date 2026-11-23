export function createCircleResultResponse(result: boolean): {
	result: boolean;
} {
	return { result };
}
export function createCircleCreateLockedResponse(): {
	error_code: string;
	message: string;
	title: string;
} {
	return {
		error_code: '06040_010405',
		message: 'ライブグランプリ終了後、プライズが配布されるまで実行できません。',
		title: 'サークル操作実行エラー',
	};
}
