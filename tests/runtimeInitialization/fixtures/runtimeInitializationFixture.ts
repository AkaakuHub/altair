import { Database } from 'bun:sqlite';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createMasterReleasePair } from '../../../src/master-archive/domain/release-pair.ts';
import { createActiveMasterIdentityFixture } from '../../masterArchive/fixtures/activeMasterIdentity.ts';

export async function createRuntimeInitializationFixture(root: string) {
	const manifest = (platform: 'android' | 'ios') => ({
		schemaVersion: 1,
		platform,
		clientVersion: '5.1.0',
		resourceVersion:
			platform === 'android'
				? 'R2606002@RQMqABAxdj0b5c8TKh4+PNDUYQ=='
				: 'R2606002@5jCt7ysy7nhExysPRoNTMbDTYQ==',
		catalog: { identitySha256: 'a'.repeat(64), sourceSha256: 'b'.repeat(64) },
		tables: [],
	});
	const android = manifest('android');
	const ios = manifest('ios');
	const pair = createMasterReleasePair([android, ios]);
	const configuration = {
		activeDatabasePath: join(root, 'active.sqlite'),
		selectedReleasePath: join(root, 'releases/selected-release.json'),
		androidManifestPath: join(root, 'android.json'),
		iosManifestPath: join(root, 'ios.json'),
	};
	await Promise.all([
		writeFile(configuration.androidManifestPath, JSON.stringify(android)),
		writeFile(configuration.iosManifestPath, JSON.stringify(ios)),
	]);
	const database = new Database(configuration.activeDatabasePath, {
		create: true,
	});
	try {
		createActiveMasterIdentityFixture(database, pair.releaseId, 'c'.repeat(64));
	} finally {
		database.close();
	}
	return {
		root,
		configuration,
		pair,
		maintenancePath: join(root, 'runtime/maintenance.json'),
	};
}
