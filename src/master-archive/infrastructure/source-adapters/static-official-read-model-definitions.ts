import generatedActiveMasterQueryManifest from '../generated-active-master-query-manifest.json';
import { STATIC_MASTER_FIELD_NAME_REGISTRY } from '../static-master-schema-field-sources.ts';
import { validateOfficialReadModelDefinitions } from './official-read-model-registry.ts';
import type { OfficialReadModelDefinition } from './source-input.ts';

export const OFFICIAL_READ_MODEL_DEFINITIONS =
	validateOfficialReadModelDefinitions(
		generatedActiveMasterQueryManifest as readonly OfficialReadModelDefinition[],
		STATIC_MASTER_FIELD_NAME_REGISTRY,
	);
