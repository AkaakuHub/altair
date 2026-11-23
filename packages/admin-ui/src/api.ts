import {
	AdminMutationCommittedError,
	adminMutationCommittedHeader,
} from '@altair/runtime/admin/domain/admin-mutation-committed-error.ts';
import type {
	OfficialDataMigrationApplyResult,
	OfficialDataMigrationPreview,
} from '@altair/runtime/admin/dto/official-data-migration.ts';
import type { RuntimeResourceOptionIds } from '@altair/runtime/admin/dto/runtime-resource-version-schema.ts';
import type { AdminFormValues } from './form-value.ts';
import type { AdminMessages } from './i18n/messages.ts';

const adminMutationStartEvent = 'linklike-admin-mutation-start';
const adminMutationEndEvent = 'linklike-admin-mutation-end';

let activeMutationCount = 0;

export async function fetchAdminState(
	pageId: string,
	signal: AbortSignal,
): Promise<unknown> {
	const response = await fetch(
		`/admin/state.json?page=${encodeURIComponent(pageId)}`,
		{ signal },
	);
	if (!response.ok) {
		throw new Error(`admin state fetch failed: ${response.status}`);
	}
	return response.json();
}

export async function postAdminForm(
	path: string,
	values: AdminFormValues,
	copy: AdminMessages['validation'],
): Promise<void> {
	await runAdminMutation(async () => {
		const form = new FormData();
		for (const [key, value] of Object.entries(values)) {
			form.set(key, String(value));
		}
		const response = await fetch(path, {
			method: 'POST',
			body: form,
			redirect: 'follow',
		});
		if (!response.ok) {
			const message = await response.text();
			if (response.headers.get(adminMutationCommittedHeader) === '1')
				throw new AdminMutationCommittedError(message);
			throw new Error(copy.httpFailure(response.status, message));
		}
	});
}

export async function postRuntimeSwitch(
	selection: RuntimeResourceOptionIds,
): Promise<void> {
	await runAdminMutation(async () => {
		const form = new FormData();
		form.set('androidResourceId', selection.android);
		form.set('iosResourceId', selection.ios);
		const response = await fetch('/admin/runtime-switch', {
			method: 'POST',
			body: form,
			redirect: 'manual',
		});
		if (response.type !== 'opaqueredirect') {
			throw new Error(`runtime switch request failed: ${response.status}`);
		}
	});
}

async function runAdminMutation<Result>(
	operation: () => Promise<Result>,
): Promise<Result> {
	if (activeMutationCount > 0) {
		throw new Error('admin update is already running');
	}
	startAdminMutation();
	try {
		return await operation();
	} finally {
		endAdminMutation();
	}
}

export async function previewOfficialDataMigrationDump(
	file: File,
	copy: AdminMessages['validation'],
): Promise<OfficialDataMigrationPreview> {
	const response = await postOfficialDataMigrationFile(
		'/admin/official-data-migration/preview',
		file,
		copy,
	);
	return response as OfficialDataMigrationPreview;
}

export async function applyOfficialDataMigrationDump(
	file: File,
	options: { accountLinkIdToken: string },
	copy: AdminMessages['validation'],
): Promise<OfficialDataMigrationApplyResult> {
	const response = await postOfficialDataMigrationFile(
		'/admin/official-data-migration/apply',
		file,
		copy,
		options,
	);
	return response as OfficialDataMigrationApplyResult;
}

export function subscribeAdminMutation(
	onChange: (isMutating: boolean) => void,
): () => void {
	const handleStart = () => onChange(true);
	const handleEnd = () => onChange(activeMutationCount > 0);

	window.addEventListener(adminMutationStartEvent, handleStart);
	window.addEventListener(adminMutationEndEvent, handleEnd);
	return () => {
		window.removeEventListener(adminMutationStartEvent, handleStart);
		window.removeEventListener(adminMutationEndEvent, handleEnd);
	};
}

async function postOfficialDataMigrationFile(
	path: string,
	file: File,
	copy: AdminMessages['validation'],
	options?: { accountLinkIdToken: string },
): Promise<unknown> {
	return runAdminMutation(async () => {
		const form = new FormData();
		form.set('dump', file);
		if (options?.accountLinkIdToken) {
			form.set('accountLinkIdToken', options.accountLinkIdToken);
		}
		const response = await fetch(path, { method: 'POST', body: form });
		if (!response.ok) {
			throw new Error(copy.httpFailure(response.status, await response.text()));
		}
		return response.json();
	});
}

function startAdminMutation(): void {
	activeMutationCount += 1;
	window.dispatchEvent(new Event(adminMutationStartEvent));
}

function endAdminMutation(): void {
	activeMutationCount = Math.max(0, activeMutationCount - 1);
	window.dispatchEvent(new Event(adminMutationEndEvent));
}
