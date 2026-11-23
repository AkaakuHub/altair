import {
	isRecord,
	type JsonRecord,
	type OfficialApiDumpEvent,
	readNumber,
	readRecord,
	readRecordArray,
	readString,
} from '@altair/admin-server/official-data-migration/application/official-data-migration-dump.ts';

export function parseApiDumpJsonl(
	text: string,
	errors: string[],
): OfficialApiDumpEvent[] {
	const events: OfficialApiDumpEvent[] = [];
	const lines = text.split(/\r?\n/);
	for (const [index, line] of lines.entries()) {
		if (line.trim().length === 0) {
			continue;
		}
		const parsed = parseJsonLine(line, index + 1, errors);
		if (parsed === null) {
			continue;
		}
		if (!isRecord(parsed)) {
			errors.push(`official_user_api_dump.jsonl:${index + 1} is not object`);
			continue;
		}
		events.push({
			lineNo: index + 1,
			path: readString(parsed.request_path),
			apiSource: readString(parsed.api_source),
			request: readEventRequest(parsed),
			response: readEventResponse(parsed),
			headers: readEventHeaders(parsed),
			statusCode: readStatusCode(parsed),
		});
	}
	return events;
}

function readEventRequest(event: JsonRecord): JsonRecord | null {
	const requestEnvelope = readRecord(event.request);
	if (requestEnvelope !== null) {
		const request = readString(requestEnvelope.request);
		return request === null
			? requestEnvelope
			: readRecord(parseJsonText(request));
	}
	const requestText = readString(event.request);
	if (requestText === null) {
		return null;
	}
	const parsedEnvelope = readRecord(parseJsonText(requestText));
	if (parsedEnvelope === null) {
		return null;
	}
	const request = readString(parsedEnvelope.request);
	return request === null ? parsedEnvelope : readRecord(parseJsonText(request));
}

function readEventResponse(event: JsonRecord): JsonRecord | null {
	const directResponse = readRecord(event.response);
	if (directResponse !== null) {
		return directResponse;
	}
	const restResponse = readRecord(event.rest_response);
	const content = restResponse ? readString(restResponse.content) : null;
	if (content === null) {
		return null;
	}
	const parsed = parseJsonText(content);
	return readRecord(parsed);
}

export function parseJsonEntryText(
	text: string,
	entryName: string,
	errors: string[],
): unknown | null {
	try {
		return JSON.parse(text) as unknown;
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		errors.push(`${entryName}: ${message}`);
		return null;
	}
}

function parseJsonLine(
	line: string,
	lineNo: number,
	errors: string[],
): unknown | null {
	try {
		return JSON.parse(line) as unknown;
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		errors.push(`official_user_api_dump.jsonl:${lineNo}: ${message}`);
		return null;
	}
}

function parseJsonText(text: string): unknown | null {
	try {
		return JSON.parse(text) as unknown;
	} catch {
		return null;
	}
}

function readStatusCode(event: JsonRecord): number | null {
	const restResponse = readRecord(event.rest_response);
	if (restResponse === null) {
		return null;
	}
	return (
		readNumber(restResponse.status_code) ??
		readNumber(restResponse.statusCode) ??
		readNumber(event.status_code)
	);
}

function readEventHeaders(event: JsonRecord): Map<string, string> {
	const restResponse = readRecord(event.rest_response);
	const headers = new Map<string, string>();
	for (const header of readRecordArray(restResponse?.headers)) {
		const name = readString(header.name);
		const value = readString(header.value) ?? readFirstString(header.values);
		if (name !== null && value !== null) {
			headers.set(name.toLowerCase(), value);
		}
	}
	return headers;
}

function readFirstString(value: unknown): string | null {
	return Array.isArray(value) ? readString(value[0]) : null;
}
