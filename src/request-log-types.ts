export type BodySnapshot = {
	body: string | null;
	bodyBytes: number;
	bodyType: 'binary' | 'json' | 'null' | 'text';
};

export type RequestLogEvent = {
	at: string;
	durationMs: number;
	method: string;
	path: string;
	requestBody: BodySnapshot;
	requestHeaders: Record<string, string>;
	responseBody: BodySnapshot;
	responseHeaders: Record<string, string>;
	assetRewriteApplied: boolean;
	status: number;
};

export type RequestLogStore = {
	write(event: RequestLogEvent): void;
};
