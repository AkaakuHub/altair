import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { validateContractExamples } from '../../tools/apiDocumentation/contractValidation.ts';
import { generateTypedContracts } from '../../tools/apiDocumentation/generateTypedContracts.ts';

const argument = process.argv[2];
if (argument !== undefined && argument !== '--check')
	throw new Error('Expected --check or no arguments');
const repository = fileURLToPath(new URL('../../', import.meta.url));
process.chdir(repository);
const document = await generateTypedContracts(repository);
validateContractExamples(document);
const destination = new URL(
	'../apiDocumentation/generated/contracts.json',
	import.meta.url,
);
if (argument === '--check') {
	const saved: unknown = JSON.parse(await readFile(destination, 'utf8'));
	if (JSON.stringify(saved) !== JSON.stringify(document))
		throw new Error(
			'API contracts are stale. Run bun run api-docs:generate and commit the generated contracts.',
		);
} else {
	await writeFile(destination, `${JSON.stringify(document, null, 2)}\n`);
}
