import type { MasterResourcePayloadReader } from '../domain/master-resource-import.ts';

export class HttpMasterResourcePayloadReader
	implements MasterResourcePayloadReader
{
	constructor(private readonly baseUrl: URL) {}

	async read(assetPath: string): Promise<Uint8Array> {
		const url = new URL(assetPath, this.baseUrl);
		let lastError: unknown;
		for (let attempt = 1; attempt <= 3; attempt += 1) {
			try {
				const response = await fetch(url, {
					signal: AbortSignal.timeout(30_000),
				});
				if (response.ok) {
					return new Uint8Array(await response.arrayBuffer());
				}
				lastError = new Error(
					`Master resource request failed: ${response.status} ${assetPath}`,
				);
				if (!retryableStatus(response.status)) break;
			} catch (error) {
				lastError = error;
			}
		}
		throw lastError instanceof Error
			? lastError
			: new Error(`Master resource request failed: ${assetPath}`);
	}
}

function retryableStatus(status: number): boolean {
	return status === 408 || status === 429 || status >= 500;
}
