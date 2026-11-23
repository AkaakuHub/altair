import type {
	JsonRecord,
	OfficialApiDumpEvent,
} from '../official-data-migration-dump.ts';

type SuccessfulOfficialDataMigrationEvent = OfficialApiDumpEvent & {
	path: string;
	response: JsonRecord;
};

function isSuccessfulOfficialDataMigrationStatus(
	event: OfficialApiDumpEvent,
): boolean {
	return (
		event.statusCode === null ||
		(event.statusCode >= 200 && event.statusCode < 400)
	);
}

export function isSuccessfulOfficialDataMigrationResponse(
	path: string,
): (
	event: OfficialApiDumpEvent,
) => event is SuccessfulOfficialDataMigrationEvent {
	return (event): event is SuccessfulOfficialDataMigrationEvent =>
		event.path === path &&
		event.response !== null &&
		isSuccessfulOfficialDataMigrationStatus(event);
}

export function latestOfficialDataMigrationResponse(
	events: readonly OfficialApiDumpEvent[],
	path: string,
): JsonRecord | null {
	for (const event of [...events].reverse()) {
		if (isSuccessfulOfficialDataMigrationResponse(path)(event)) {
			return event.response;
		}
	}
	return null;
}
