export function currentUtcIsoDateTime(): string {
	return new Date().toISOString();
}

export function addUtcDays(date: Date, days: number): string {
	return new Date(date.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

export function currentJstIsoDateTime(): string {
	return formatJstIsoDateTime(new Date());
}

export function jstGameDate(date: Date): string {
	const jstGameDayStartOffsetHours = 9 - 4;
	const gameDate = new Date(
		date.getTime() + jstGameDayStartOffsetHours * 60 * 60 * 1000,
	);
	return gameDate.toISOString().slice(0, 10);
}

export function nextJstGameDateBoundaryIsoDateTime(date: Date): string {
	const jstNow = new Date(date.getTime() + 9 * 60 * 60 * 1000);
	const nextBoundaryJstDate =
		jstNow.getUTCHours() < 4 ? jstNow.getUTCDate() : jstNow.getUTCDate() + 1;
	const nextBoundaryUtc = new Date(
		Date.UTC(
			jstNow.getUTCFullYear(),
			jstNow.getUTCMonth(),
			nextBoundaryJstDate,
			-5,
			0,
			0,
		),
	);
	return formatJstIsoDateTime(nextBoundaryUtc);
}

function formatJstIsoDateTime(date: Date): string {
	const jstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
	return `${jstDate.toISOString().slice(0, 19)}+09:00`;
}
