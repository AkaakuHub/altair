import type { Context, Hono } from 'hono';
import type { AdminRuntimeConfig } from '../../../../src/admin/configuration/runtimeConfig.ts';
import { persistServerState } from '../../../../src/server-state.ts';
import type { ServerState } from '../../../../src/server-state-schema.ts';
import type { AdminForm } from '../forms/shared/admin-form-values.ts';
import { getFormString } from '../forms/shared/admin-form-values.ts';
import type { OfficialDataMigrationDump } from '../official-data-migration/application/official-data-migration-dump.ts';
import type { OfficialDataMigrationDumpReader } from '../official-data-migration/application/official-data-migration-dump-reader.ts';

type UploadedOfficialDataMigrationDump = {
	accountLinkIdToken: string;
	dump: OfficialDataMigrationDump;
};

export async function parseAdminForm(c: Context): Promise<AdminForm> {
	const parsed = await c.req.parseBody();
	const form: AdminForm = {};
	for (const [key, value] of Object.entries(parsed)) {
		if (typeof value === 'string') {
			form[key] = value;
		}
	}
	return form;
}

export function persistAdminState(
	config: AdminRuntimeConfig,
	state: ServerState,
): void {
	persistServerState(config.stateStore, state);
}

export function redirectAdmin(c: Context): Response {
	return c.redirect('/admin');
}

export function applyWithAdminFormPlayerDependency<T>(
	form: AdminForm,
	resolve: (playerId: string) => T,
	apply: (dependency: T, playerId: string) => boolean,
): boolean {
	const playerId = getFormString(form, 'playerId');
	if (playerId.length === 0) {
		return false;
	}
	return apply(resolve(playerId), playerId);
}

export async function readUploadedDump(
	c: Context,
	dumpReader: OfficialDataMigrationDumpReader,
): Promise<UploadedOfficialDataMigrationDump | Response> {
	const parsed = await c.req.parseBody();
	const dumpFile = parsed.dump;
	if (!(dumpFile instanceof File)) {
		return c.text('dump file is required', 400);
	}
	const data = new Uint8Array(await dumpFile.arrayBuffer());
	try {
		return {
			dump: dumpReader.read(data),
			accountLinkIdToken: readStringFormField(parsed.accountLinkIdToken),
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return c.text(`invalid official data dump: ${message}`, 400);
	}
}

export function registerAdminFormRoute(
	app: Hono,
	path: string,
	config: AdminRuntimeConfig,
	state: ServerState,
	invalidMessage: string,
	applyForm: (form: AdminForm) => boolean,
): void {
	app.post(path, async (c) => {
		const form = await parseAdminForm(c);
		if (!applyForm(form)) {
			return c.text(invalidMessage, 400);
		}
		persistAdminState(config, state);
		return redirectAdmin(c);
	});
}

function readStringFormField(value: unknown): string {
	return typeof value === 'string' ? value.trim() : '';
}
