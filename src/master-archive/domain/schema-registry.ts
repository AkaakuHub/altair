import { createHash } from 'node:crypto';
import type { GenericMasterField } from './generic-master-binary.ts';
import type { PlatformManifest } from './platform-manifest.ts';

export function schemaFingerprint(
	tableLabel: string,
	descriptors: readonly Pick<
		GenericMasterField,
		'index' | 'crc' | 'typeCode'
	>[],
): string {
	const fields = [...descriptors]
		.sort((left, right) => left.index - right.index)
		.map((field) => ({
			index: field.index,
			crc: field.crc,
			binaryTypeCode: field.typeCode,
		}));
	return createHash('sha256')
		.update(JSON.stringify({ tableLabel, fields }))
		.digest('hex');
}

type ManifestTableDelta = Readonly<{
	added: readonly string[];
	changed: readonly string[];
	removed: readonly string[];
	unchanged: readonly string[];
}>;

export function compareManifestTables(
	previous: PlatformManifest,
	next: PlatformManifest,
): ManifestTableDelta {
	const previousByLabel = new Map(
		previous.tables.map((table) => [table.label, table]),
	);
	const nextByLabel = new Map(next.tables.map((table) => [table.label, table]));
	const added: string[] = [];
	const changed: string[] = [];
	const removed: string[] = [];
	const unchanged: string[] = [];
	for (const [label, previousTable] of previousByLabel) {
		const nextTable = nextByLabel.get(label);
		if (nextTable === undefined) {
			removed.push(label);
		} else if (
			previousTable.blobSha256 !== nextTable.blobSha256 ||
			previousTable.schemaFingerprint !== nextTable.schemaFingerprint
		) {
			changed.push(label);
		} else {
			unchanged.push(label);
		}
	}
	for (const label of nextByLabel.keys()) {
		if (!previousByLabel.has(label)) {
			added.push(label);
		}
	}
	return {
		added: added.sort(),
		changed: changed.sort(),
		removed: removed.sort(),
		unchanged: unchanged.sort(),
	};
}
