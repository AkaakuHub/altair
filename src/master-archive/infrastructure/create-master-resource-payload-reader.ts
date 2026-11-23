import { fileURLToPath } from 'node:url';
import type { MasterResourcePayloadReader } from '../domain/master-resource-import.ts';
import { FileMasterResourcePayloadReader } from './file-master-resource-payload-reader.ts';
import { HttpMasterResourcePayloadReader } from './http-master-resource-payload-reader.ts';

export function createMasterResourcePayloadReader(
	baseUrl: URL,
): MasterResourcePayloadReader {
	switch (baseUrl.protocol) {
		case 'file:':
			if (baseUrl.search.length > 0 || baseUrl.hash.length > 0)
				throw new Error(
					'Master resource file URL must not contain a query or fragment',
				);
			return new FileMasterResourcePayloadReader(fileURLToPath(baseUrl));
		case 'http:':
		case 'https:':
			return new HttpMasterResourcePayloadReader(baseUrl);
		default:
			throw new Error('Master resource source must use file, HTTP or HTTPS');
	}
}
