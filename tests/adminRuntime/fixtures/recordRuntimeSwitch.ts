import { writeFile } from 'node:fs/promises';

const [destination, marker, mode, selectionJson] = process.argv.slice(2);
if (
	destination === undefined ||
	marker === undefined ||
	mode !== '--selection' ||
	selectionJson === undefined
)
	throw new Error('Runtime switch fixture arguments are missing');
if (marker === 'fail') process.exit(7);
const selection: unknown = JSON.parse(selectionJson);
await writeFile(destination, JSON.stringify({ marker, mode, selection }));
