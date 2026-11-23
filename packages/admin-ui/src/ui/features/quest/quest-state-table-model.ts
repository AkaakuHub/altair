import type { AdminStateResponse } from '@altair/runtime/admin/dto/admin-state-response-schema.ts';
import type { AdminQuestStageProgress } from '@altair/runtime/admin/dto/admin-visible-state-schema.ts';

type StandardQuestArea = AdminStateResponse['standardQuestAreas'][number];
type StandardQuestStage = StandardQuestArea['stages'][number];
type StandardQuestStageRow = {
	area: StandardQuestArea;
	stage: StandardQuestStage;
	progress: AdminQuestStageProgress;
};

export function createStandardQuestRowsByArea(
	areas: StandardQuestArea[],
	questRows: AdminQuestStageProgress[],
): Array<{ area: StandardQuestArea; rows: StandardQuestStageRow[] }> {
	const questRowByStageId = new Map(questRows.map((row) => [row.stageId, row]));
	return areas.map((area) => ({
		area,
		rows: area.stages.map((stage) => ({
			area,
			stage,
			progress:
				questRowByStageId.get(stage.stageId) ??
				createEmptyStandardQuestProgress(stage.stageId),
		})),
	}));
}

function createEmptyStandardQuestProgress(
	stageId: number,
): AdminQuestStageProgress {
	return {
		questLiveType: 1,
		stageId,
		highScore: 0,
		bestLoveMusicId: 0,
		playCount: 0,
	};
}
