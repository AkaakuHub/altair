import type { Database } from 'bun:sqlite';
import type { StepUpBeginnerMissionMaster } from '../state/step-up-beginner-mission-master.ts';

type StepUpBeginnerMissionRow = {
	id: number;
	sort_order: number;
};

export function getStepUpBeginnerMissionsFromDatabase(
	database: Database,
): StepUpBeginnerMissionMaster[] {
	return database
		.query<StepUpBeginnerMissionRow, []>(
			[
				'SELECT id, sort_order',
				'FROM master_missions',
				'WHERE mission_type = 94',
				'ORDER BY sort_order, id',
			].join(' '),
		)
		.all()
		.map((row) => ({
			missionId: row.id,
		}));
}
