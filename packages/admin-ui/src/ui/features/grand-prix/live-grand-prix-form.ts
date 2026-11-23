import type { GrandPrixSummary } from '@altair/runtime/admin/dto/admin-grand-prix-schema.ts';
import type { AdminGrandPrixRuntime } from '@altair/runtime/admin/dto/admin-visible-state-schema.ts';
import type { AdminFormValues } from '../../../form-value.ts';

export function getGrandPrixStageMusicValue<Value extends number | string>(
	runtime: {
		stageOverrides: readonly { stageId: number; questMusicsDetail: Value }[];
	},
	stageId: number,
	originalMusicId: Value,
): Value {
	return (
		runtime.stageOverrides.find((override) => override.stageId === stageId)
			?.questMusicsDetail ?? originalMusicId
	);
}

export function setGrandPrixStageMusic(
	runtime: AdminGrandPrixRuntime,
	stageId: number,
	musicId: number,
): AdminGrandPrixRuntime {
	return {
		...runtime,
		stageOverrides:
			musicId <= 0
				? runtime.stageOverrides.filter(
						(override) => override.stageId !== stageId,
					)
				: [
						...runtime.stageOverrides.filter(
							(override) => override.stageId !== stageId,
						),
						{
							stageId,
							questMusicsType: 2,
							questMusicsDetail: musicId,
						},
					].sort((left, right) => left.stageId - right.stageId),
	};
}

export function grandPrixFormValues(
	grandPrix: AdminGrandPrixRuntime,
): AdminFormValues {
	return {
		'grandPrix.activeGrandPrixId': grandPrix.activeGrandPrixId,
		'grandPrix.grandPrixType': grandPrix.grandPrixType,
		'grandPrix.status': grandPrix.status,
		'grandPrix.dailyPlayableCount': grandPrix.dailyPlayableCount,
		'grandPrix.startDate': grandPrix.startDate,
		'grandPrix.endDate': grandPrix.endDate,
		'grandPrix.guildTotalPoint': grandPrix.guildTotalPoint,
		'grandPrix.guildRanking': grandPrix.guildRanking,
		'grandPrix.withinGuildRanking': grandPrix.withinGuildRanking,
		'grandPrix.personalTotalPoint': grandPrix.personalTotalPoint,
		'grandPrix.personalRanking': grandPrix.personalRanking,
		...Object.fromEntries(
			grandPrix.stageOverrides.map((override) => [
				`grandPrix.stageOverrides.${override.stageId}.musicId`,
				override.questMusicsDetail,
			]),
		),
	};
}

export function filterGrandPrixRows(
	rows: GrandPrixSummary[],
	query: string,
): GrandPrixSummary[] {
	const normalized = query.trim().toLowerCase();
	return normalized === ''
		? rows
		: rows.filter((row) =>
				[row.grandPrixId, row.grandPrixType, row.startDate, row.endDate].some(
					(value) => String(value).toLowerCase().includes(normalized),
				),
			);
}
