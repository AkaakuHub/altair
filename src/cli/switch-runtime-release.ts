import { join } from 'node:path';
import { z } from 'zod';
import { resolveRuntimeResourceSelection } from '../application/runtime-switch/runtime-resource-selection.ts';
import { runtimeResourceSelectionSchema } from '../application/runtime-switch/runtime-resource-selection-schema.ts';
import { createNodeRuntimeSwitch } from '../application/runtime-switch/runtime-switch-node-ports.ts';
import { resolveOfficialRuntimeRelease } from '../application/runtime-switch/runtime-switch-release-resolver.ts';
import { resolveOfficialRuntimeTarget } from '../application/runtime-switch/runtime-switch-service.ts';
import { absolutePathSchema } from '../configuration/environment.ts';
import { resolveRuntimeStorageLayout } from '../configuration/runtime-storage-layout.ts';

const storage = resolveRuntimeStorageLayout();
const archiveRoot = storage.masterArchiveRoot;
const switchOptions = z
	.strictObject({
		controlScript: absolutePathSchema,
		backendBaseUrl: z.url(),
		publicApiBaseUrl: z.url(),
	})
	.parse(
		await Bun.file(join(storage.root, 'config/runtime-switch.json')).json(),
	);
const arguments_ = Bun.argv.slice(2);
const target =
	arguments_[0] === '--selection'
		? await selectedTarget(arguments_)
		: await savedTarget(arguments_);

async function selectedTarget(arguments_: string[]) {
	if (arguments_.length !== 2 || arguments_[1] === undefined)
		throw new Error('Usage: runtime:switch --selection <json>');
	return await resolveRuntimeResourceSelection(
		archiveRoot,
		runtimeResourceSelectionSchema.parse(JSON.parse(arguments_[1])),
	);
}

async function savedTarget(arguments_: string[]) {
	const [releaseId] = arguments_;
	if (
		arguments_.length !== 1 ||
		releaseId === undefined ||
		!/^[0-9a-f]{64}$/u.test(releaseId)
	)
		throw new Error('Usage: runtime:switch <release-id>');
	const manifests = await resolveOfficialRuntimeRelease(archiveRoot, releaseId);
	return {
		expectedReleaseId: releaseId,
		release: { kind: 'official' as const, manifests },
	};
}
const composition = createNodeRuntimeSwitch(
	{
		...target,
		archiveRoot,
		activeDatabasePath: storage.activeMasterDatabasePath,
		selectedReleasePath: storage.selectedMasterReleasePath,
	},
	resolveOfficialRuntimeTarget,
	switchOptions,
);
const result = await composition.service.switch(composition.request);
console.log(JSON.stringify(result, null, 2));
