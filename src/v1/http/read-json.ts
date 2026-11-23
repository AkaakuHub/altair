export async function readJson(request: Request): Promise<unknown> {
	const text = await request.text();
	if (text.length === 0) {
		return undefined;
	}
	try {
		return JSON.parse(text) as unknown;
	} catch {
		return undefined;
	}
}
