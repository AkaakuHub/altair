import type { JsonRecord } from '@altair/admin-server/official-data-migration/application/official-data-migration-dump.ts';
import {
	readNumber,
	readString,
} from '@altair/admin-server/official-data-migration/application/official-data-migration-dump.ts';

type OfficialDataMigrationPreviewFields = {
	formatVersion: number;
	playerId: string | null;
	deviceSpecificId: string | null;
	createdAtUtc: string | null;
};

export function readOfficialDataMigrationPreviewFields(
	manifest: JsonRecord,
): OfficialDataMigrationPreviewFields {
	return {
		formatVersion: readNumber(manifest.format_version) ?? 0,
		playerId: readString(manifest.player_id),
		deviceSpecificId: readString(manifest.device_specific_id),
		createdAtUtc: readString(manifest.created_at_utc),
	};
}
