import {
	createDateTimeDraft,
	type DateTimeDraft,
} from '../../../domain/forms/dateTimeDraft.ts';

export type SeasonRuntime = {
	seasonId: number;
	status: number;
	startDate: string;
	endDate: string;
};
export type SeasonDraft = Omit<SeasonRuntime, 'startDate' | 'endDate'> & {
	startDate: DateTimeDraft;
	endDate: DateTimeDraft;
};
export function createSeasonRuntimeDraft(source: SeasonRuntime): SeasonDraft {
	return {
		...source,
		startDate: createDateTimeDraft(
			source.startDate === '' ? null : source.startDate,
		),
		endDate: createDateTimeDraft(source.endDate === '' ? null : source.endDate),
	};
}
