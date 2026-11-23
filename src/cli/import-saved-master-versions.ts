import { importSavedMasterVersions } from '../master-archive/infrastructure/import-saved-master-versions.ts';

if (process.argv.length !== 2)
	throw new Error('Usage: master-archive:import-saved');
console.log(JSON.stringify(await importSavedMasterVersions(), null, 2));
