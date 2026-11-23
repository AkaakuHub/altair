import type { GrandPrixSummary } from '@altair/runtime/admin/dto/admin-grand-prix-schema.ts';
import type { AdminGrandPrixRuntime } from '@altair/runtime/admin/dto/admin-visible-state-schema.ts';
import {
	createDateTimeDraft,
	type DateTimeDraft,
	dateTimeDraftToIso,
} from '../../../domain/forms/dateTimeDraft.ts';
import type { AdminFormValues } from '../../../form-value.ts';
import type { AdminMessages } from '../../../i18n/messages.ts';
import {
	grandPrixFormValues,
	setGrandPrixStageMusic,
} from './live-grand-prix-form.ts';

type NumericKey =
	| 'grandPrixType'
	| 'dailyPlayableCount'
	| 'guildTotalPoint'
	| 'guildRanking'
	| 'withinGuildRanking'
	| 'personalTotalPoint'
	| 'personalRanking';
export type GrandPrixRuntimeDraft = Omit<
	AdminGrandPrixRuntime,
	NumericKey | 'startDate' | 'endDate' | 'stageOverrides'
> &
	Record<NumericKey, string> & {
		startDate: DateTimeDraft;
		endDate: DateTimeDraft;
		stageOverrides: Array<{
			stageId: number;
			questMusicsType: number;
			questMusicsDetail: string;
		}>;
	};

export function createGrandPrixRuntimeDraft(
	runtime: AdminGrandPrixRuntime,
): GrandPrixRuntimeDraft {
	return {
		...runtime,
		grandPrixType: String(runtime.grandPrixType),
		dailyPlayableCount: String(runtime.dailyPlayableCount),
		guildTotalPoint: String(runtime.guildTotalPoint),
		guildRanking: String(runtime.guildRanking),
		withinGuildRanking: String(runtime.withinGuildRanking),
		personalTotalPoint: String(runtime.personalTotalPoint),
		personalRanking: String(runtime.personalRanking),
		startDate: createDateTimeDraft(
			runtime.startDate === '' ? null : runtime.startDate,
		),
		endDate: createDateTimeDraft(
			runtime.endDate === '' ? null : runtime.endDate,
		),
		stageOverrides: runtime.stageOverrides.map((override) => ({
			...override,
			questMusicsDetail: String(override.questMusicsDetail),
		})),
	};
}

function buildGrandPrixRuntime(
	draft: GrandPrixRuntimeDraft,
	messages: AdminMessages,
): AdminGrandPrixRuntime {
	let runtime: AdminGrandPrixRuntime = {
		...draft,
		grandPrixType: Number(draft.grandPrixType),
		dailyPlayableCount: Number(draft.dailyPlayableCount),
		guildTotalPoint: Number(draft.guildTotalPoint),
		guildRanking: Number(draft.guildRanking),
		withinGuildRanking: Number(draft.withinGuildRanking),
		personalTotalPoint: Number(draft.personalTotalPoint),
		personalRanking: Number(draft.personalRanking),
		startDate: dateTimeDraftToIso(draft.startDate, messages.validation),
		endDate: dateTimeDraftToIso(draft.endDate, messages.validation),
		stageOverrides: [],
	};
	for (const override of draft.stageOverrides)
		runtime = setGrandPrixStageMusic(
			runtime,
			override.stageId,
			Number(override.questMusicsDetail),
		);
	return runtime;
}

export function buildGrandPrixRuntimeForm(
	draft: GrandPrixRuntimeDraft,
	messages: AdminMessages,
): {
	runtime: AdminGrandPrixRuntime;
	values: AdminFormValues;
} {
	const runtime = buildGrandPrixRuntime(draft, messages);
	const values = grandPrixFormValues(runtime);
	for (const override of draft.stageOverrides)
		values[`grandPrix.stageOverrides.${override.stageId}.musicId`] = Number(
			override.questMusicsDetail,
		);
	return { runtime, values };
}

export function selectGrandPrixDraft(
	current: GrandPrixRuntimeDraft,
	grandPrix: GrandPrixSummary,
): GrandPrixRuntimeDraft {
	return {
		...current,
		activeGrandPrixId: grandPrix.grandPrixId,
		grandPrixType: String(grandPrix.grandPrixType),
		startDate: createDateTimeDraft(
			grandPrix.startDate === '' ? null : grandPrix.startDate,
		),
		endDate: createDateTimeDraft(
			grandPrix.endDate === '' ? null : grandPrix.endDate,
		),
		stageOverrides: [],
	};
}

export function setGrandPrixDraftMusic(
	current: GrandPrixRuntimeDraft,
	stageId: number,
	musicId: string,
): GrandPrixRuntimeDraft {
	return {
		...current,
		stageOverrides: [
			...current.stageOverrides.filter(
				(override) => override.stageId !== stageId,
			),
			{ stageId, questMusicsType: 2, questMusicsDetail: musicId },
		].sort((left, right) => left.stageId - right.stageId),
	};
}
