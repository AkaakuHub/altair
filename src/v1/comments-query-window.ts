export function createCommentSecondWindow(playTimeSecond: number) {
	const startMillisecond = playTimeSecond * 1000;
	return { startMillisecond, endMillisecond: startMillisecond + 1000 };
}

export function createCommentAfterCursor(
	playTimeMillisecond: number,
	limit: number,
) {
	return { playTimeMillisecond, limit };
}

export function createCommentRange(
	fromPlayTimeMillisecond: number,
	toPlayTimeMillisecond: number,
	limit: number,
) {
	return { fromPlayTimeMillisecond, toPlayTimeMillisecond, limit };
}
