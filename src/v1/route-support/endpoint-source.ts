export function apkDumpTypedEndpoint<Request, Response>(
	documentation?: Readonly<{ requiresSession: true }>,
): void {
	void documentation;
	const marker: Readonly<{ request: Request; response: Response }> | undefined =
		undefined;
	void marker;
}

export { apkDumpTypedEndpoint as typedEndpoint };
