import type { BodySnapshot } from './request-log-types.ts';

const textEncoder = new TextEncoder();

export function headersToRecord(headers: Headers): Record<string, string> {
	const record: Record<string, string> = {};
	headers.forEach((value, name) => {
		record[name] = value;
	});
	return record;
}

export async function readRequestBodySnapshot(
	request: Request,
): Promise<BodySnapshot> {
	if (request.method === 'GET' || request.method === 'HEAD') {
		return emptyBodySnapshot();
	}
	if (!isTextBody(request.headers.get('content-type'))) {
		return binaryBodySnapshot(request.headers);
	}
	const text = await request.clone().text();
	return createBodySnapshot(text, request.headers.get('content-type'));
}

export async function readResponseBodySnapshot(
	response: Response,
): Promise<BodySnapshot> {
	if (isStreamingResponse(response)) {
		return emptyBodySnapshot();
	}
	if (!isTextBody(response.headers.get('content-type'))) {
		return binaryBodySnapshot(response.headers);
	}
	const text = await response.clone().text();
	return createBodySnapshot(text, response.headers.get('content-type'));
}

function isTextBody(contentType: string | null): boolean {
	if (contentType === null) return true;
	const mediaType = contentType.split(';', 1)[0]?.trim().toLowerCase();
	return (
		mediaType?.startsWith('text/') === true ||
		mediaType === 'application/json' ||
		mediaType?.endsWith('+json') === true ||
		mediaType === 'application/xml' ||
		mediaType?.endsWith('+xml') === true ||
		mediaType === 'application/x-www-form-urlencoded'
	);
}

function binaryBodySnapshot(headers: Headers): BodySnapshot {
	const contentLength = headers.get('content-length');
	const bodyBytes = contentLength === null ? 0 : Number(contentLength);
	return {
		body: null,
		bodyBytes:
			Number.isSafeInteger(bodyBytes) && bodyBytes >= 0 ? bodyBytes : 0,
		bodyType: 'binary',
	};
}

function isStreamingResponse(response: Response): boolean {
	return (
		response.headers.get('transfer-encoding') === 'chunked' ||
		response.headers.get('content-type')?.includes('text/event-stream') === true
	);
}

export function createBodySnapshot(
	text: string,
	contentType: string | null,
): BodySnapshot {
	if (text.length === 0) {
		return emptyBodySnapshot();
	}
	return {
		body: text,
		bodyBytes: textEncoder.encode(text).length,
		bodyType: isJsonBody(contentType, text) ? 'json' : 'text',
	};
}

function emptyBodySnapshot(): BodySnapshot {
	return {
		body: null,
		bodyBytes: 0,
		bodyType: 'null',
	};
}

function isJsonBody(contentType: string | null, text: string): boolean {
	if (contentType?.includes('application/json')) {
		return true;
	}
	try {
		JSON.parse(text);
		return true;
	} catch {
		return false;
	}
}
