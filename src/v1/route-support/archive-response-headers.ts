export function renderArchiveResponseHeader(
	value: string,
	dateGmt: string,
	resourceVersion: string,
): string {
	return value
		.replaceAll('${DATE_GMT}', dateGmt)
		.replaceAll('${RES_VERSION}', resourceVersion);
}
