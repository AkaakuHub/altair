import type { Database } from 'bun:sqlite';
import type { Hono } from 'hono';
import type { AdminRuntimeConfig } from '../../../../src/admin/configuration/runtimeConfig.ts';
import type { UserStatusControllerProvider } from '../../../../src/application/user-status-controller.ts';
import type { ServerState } from '../../../../src/server-state-schema.ts';
import { applyOfficialDataMigrationDump } from '../official-data-migration/application/official-data-migration-apply.ts';
import type { OfficialDataMigrationDumpReader } from '../official-data-migration/application/official-data-migration-dump-reader.ts';
import {
	persistAdminState,
	readUploadedDump,
} from '../route-support/admin-route-helpers.ts';

export function registerAdminOfficialDataMigrationRoutes(
	app: Hono,
	config: AdminRuntimeConfig,
	state: ServerState,
	resolveUserStatus: UserStatusControllerProvider,
	dumpReader: OfficialDataMigrationDumpReader,
	resolveCurrentMasterDatabase: () => Database,
): void {
	app.post('/official-data-migration/preview', async (c) => {
		const request = await readUploadedDump(c, dumpReader);
		if (request instanceof Response) {
			return request;
		}
		return c.json(request.dump.preview);
	});

	app.post('/official-data-migration/apply', async (c) => {
		const request = await readUploadedDump(c, dumpReader);
		if (request instanceof Response) {
			return request;
		}
		const result = applyOfficialDataMigrationDump(
			state,
			request.dump,
			resolveUserStatus(),
			resolveCurrentMasterDatabase(),
			{
				accountLinkIdToken: request.accountLinkIdToken,
			},
		);
		persistAdminState(config, state);
		return c.json(result);
	});
}
