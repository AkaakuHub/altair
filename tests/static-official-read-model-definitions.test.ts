import { describe, expect, test } from 'bun:test';
import { STATIC_MASTER_FIELD_NAME_REGISTRY } from '../src/master-archive/infrastructure/static-master-schema-field-sources.ts';

describe('static official read model definitions', () => {
	test('resolves the active read model Id field', () => {
		expect(
			STATIC_MASTER_FIELD_NAME_REGISTRY.resolveFieldCrcs({
				tableLabel: 'advdatas.tsv',
				officialFieldName: 'Id',
				typeCode: 0x20,
			}),
		).toContain(3_529_753_607);
	});
});
