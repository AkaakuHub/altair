type GachaSeriesSchedule = {
	startTime: string;
	endTime: string;
	timeLimitType: number;
	availableTimeHours: number;
};

const availableTimeLimitType = 1;

export function isGachaSeriesOpen(
	schedule: GachaSeriesSchedule,
	now: string,
): boolean {
	return (
		Date.parse(schedule.startTime) <= Date.parse(now) &&
		Date.parse(schedule.endTime) > Date.parse(now)
	);
}

export function getGachaSeriesTimeLimitEndTime(
	schedule: GachaSeriesSchedule,
	now: string,
): string | null {
	if (schedule.timeLimitType !== availableTimeLimitType) {
		return null;
	}
	return new Date(
		Date.parse(now) + schedule.availableTimeHours * 60 * 60 * 1000,
	).toISOString();
}
