import type { Database } from 'bun:sqlite';
import {
	type AdminForm,
	getFormInteger,
	getOptionalFormString,
} from '@altair/admin-server/forms/shared/admin-form-values.ts';
import { getGrandPrixMasterRuntimeDefaultsFromDatabase } from '../../../../../src/master-data/grand-prix-runtime-defaults.ts';
import { ensureGrandPrixRuntimeState } from '../../../../../src/server-state.ts';
import type {
	GrandPrixStageRuntimeOverride,
	ServerState,
} from '../../../../../src/server-state-schema.ts';
import { syncGrandPrixRankingFromRuntime } from '../../../../../src/state/grand-prix-ranking-runtime-sync.ts';
import { clampGrandPrixStatus } from '../../../../../src/state/grand-prix-runtime-status.ts';

export function updateGrandPrixRuntimeState(
	form: AdminForm,
	state: ServerState,
	database: Database,
): void {
	const grandPrix = ensureGrandPrixRuntimeState(state);
	const previousGuildTotalPoint = grandPrix.guildTotalPoint;
	const previousGuildRanking = grandPrix.guildRanking;
	const previousPersonalTotalPoint = grandPrix.personalTotalPoint;
	const previousPersonalRanking = grandPrix.personalRanking;
	const previousGrandPrixId = grandPrix.activeGrandPrixId;
	const activeGrandPrixId = getFormInteger(
		form,
		'grandPrix.activeGrandPrixId',
		grandPrix.activeGrandPrixId,
	);
	grandPrix.activeGrandPrixId = activeGrandPrixId;
	if (activeGrandPrixId !== previousGrandPrixId) {
		const defaults = getGrandPrixMasterRuntimeDefaultsFromDatabase(
			database,
			activeGrandPrixId,
		);
		if (defaults !== undefined) {
			grandPrix.grandPrixType = defaults.grandPrixType;
			grandPrix.startDate = defaults.startDate;
			grandPrix.endDate = defaults.endDate;
			if (defaults.dailyPlayableCount > 0) {
				grandPrix.dailyPlayableCount = defaults.dailyPlayableCount;
			}
		}
		grandPrix.stageOverrides = [];
	}
	grandPrix.grandPrixType = getFormInteger(
		form,
		'grandPrix.grandPrixType',
		grandPrix.grandPrixType,
	);
	grandPrix.status = clampGrandPrixStatus(
		getFormInteger(form, 'grandPrix.status', grandPrix.status),
	);
	grandPrix.dailyPlayableCount = getFormInteger(
		form,
		'grandPrix.dailyPlayableCount',
		grandPrix.dailyPlayableCount,
	);
	const startDate = getOptionalFormString(form, 'grandPrix.startDate');
	if (startDate !== undefined && startDate.length > 0) {
		grandPrix.startDate = startDate;
	}
	const endDate = getOptionalFormString(form, 'grandPrix.endDate');
	if (endDate !== undefined && endDate.length > 0) {
		grandPrix.endDate = endDate;
	}
	grandPrix.guildTotalPoint = getFormInteger(
		form,
		'grandPrix.guildTotalPoint',
		grandPrix.guildTotalPoint,
	);
	grandPrix.guildRanking = getFormInteger(
		form,
		'grandPrix.guildRanking',
		grandPrix.guildRanking,
	);
	grandPrix.withinGuildRanking = getFormInteger(
		form,
		'grandPrix.withinGuildRanking',
		grandPrix.withinGuildRanking,
	);
	grandPrix.personalTotalPoint = getFormInteger(
		form,
		'grandPrix.personalTotalPoint',
		grandPrix.personalTotalPoint,
	);
	grandPrix.personalRanking = getFormInteger(
		form,
		'grandPrix.personalRanking',
		grandPrix.personalRanking,
	);
	grandPrix.stageOverrides = updateGrandPrixStageOverrides(
		form,
		grandPrix.stageOverrides,
	);
	const syncCircle =
		grandPrix.guildRanking !== previousGuildRanking ||
		grandPrix.guildTotalPoint !== previousGuildTotalPoint;
	const syncPersonal =
		grandPrix.personalRanking !== previousPersonalRanking ||
		grandPrix.personalTotalPoint !== previousPersonalTotalPoint;
	if (syncCircle || syncPersonal) {
		syncGrandPrixRankingFromRuntime(state, { syncCircle, syncPersonal });
	}
}

export function updateGrandPrixStageOverrides(
	form: AdminForm,
	currentOverrides: GrandPrixStageRuntimeOverride[],
): GrandPrixStageRuntimeOverride[] {
	const overrides = new Map(
		currentOverrides.map((override) => [override.stageId, override]),
	);
	for (const key of Object.keys(form)) {
		const match = /^grandPrix\.stageOverrides\.(\d+)\.musicId$/.exec(key);
		if (match === null) {
			continue;
		}
		const stageId = Number(match[1]);
		const musicId = getFormInteger(form, key, 0);
		if (musicId <= 0) {
			overrides.delete(stageId);
			continue;
		}
		overrides.set(stageId, {
			stageId,
			questMusicsType: 2,
			questMusicsDetail: musicId,
		});
	}
	return [...overrides.values()].sort(
		(left, right) => left.stageId - right.stageId,
	);
}
