import { expect, test } from 'bun:test';
import { applyRawServerStateMigrations } from '../src/state-migrations/raw-server-state-migrations.ts';

test('master snapshot identity namesをmaster release identityへ明示migrationする', () => {
	const state = {
		chapter: {},
		session: {
			masterSnapshotId: 'release-a',
			card: {
				source_snapshot_id: 'release-a',
			},
			reward: {
				sourceSnapshotId: 'release-a',
				definitionSnapshotId: 'release-a',
			},
		},
	};

	const migrated = applyRawServerStateMigrations(state);

	expect(migrated).toMatchObject({
		session: {
			masterReleaseId: 'release-a',
			card: {
				source_master_release_id: 'release-a',
			},
			reward: {
				sourceMasterReleaseId: 'release-a',
				definitionMasterReleaseId: 'release-a',
			},
		},
	});
	expect(JSON.stringify(migrated)).not.toContain('SnapshotId');
	expect(JSON.stringify(migrated)).not.toContain('source_snapshot_id');
});
