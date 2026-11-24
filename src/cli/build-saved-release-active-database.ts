import { buildSavedReleaseActiveDatabase } from '../master-archive/infrastructure/build-saved-release-active-database.ts';
import { parseCandidateBuildArgument } from '../master-archive/infrastructure/candidate-build-arguments.ts';

const [argument, payload, extra] = Bun.argv.slice(2);
if (argument !== '--candidate' || payload === undefined || extra !== undefined)
	throw new Error('Candidate build payload is required');

const { kind, releaseId, ...paths } = parseCandidateBuildArgument(payload);
if (kind !== 'official' && kind !== 'platform-selection')
	throw new Error('Unknown candidate release kind');

console.log(
	JSON.stringify(
		await buildSavedReleaseActiveDatabase({
			...paths,
			release: { kind, expectedReleaseIdentity: releaseId },
		}),
		null,
		2,
	),
);
