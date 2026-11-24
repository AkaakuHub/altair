import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { preflightConfiguredRuntimeRelease } from '../application/runtime-release/runtime-release-preflight-service.ts';

const runtimeExpectationCommonSchema = {
	clientVersion: z.string().min(1),
	revision: z.string().regex(/^R\d+$/u),
};

const musicExpectationSchema = z
	.object({ musicId: z.number().int().positive() })
	.strict();

const storyExpectationSchema = z
	.object({
		advSeriesId: z.number().int().positive(),
		advDataId: z.number().int().positive(),
	})
	.strict();

const planSchema = z.object({
	schemaVersion: z.literal(1),
	release: z
		.object({
			resourceVersionRegistryRoot: z.string().min(1),
			activeMasterDatabasePath: z.string().min(1),
			selectedMasterReleasePath: z.string().min(1),
		})
		.strict(),
	expectations: z.union([
		z
			.object({
				...runtimeExpectationCommonSchema,
				music: musicExpectationSchema,
				story: storyExpectationSchema.optional(),
			})
			.strict(),
		z
			.object({
				...runtimeExpectationCommonSchema,
				music: musicExpectationSchema.optional(),
				story: storyExpectationSchema,
			})
			.strict(),
	]),
});

export function runRuntimeReleasePreflight(
	arguments_: string[],
	inspectRelease = preflightConfiguredRuntimeRelease,
): void {
	if (arguments_.length !== 1) {
		writeResult(2, {
			ok: false,
			error: {
				code: 'usage-error',
				message:
					'Usage: bun src/cli/preflight-runtime-release.ts <runtime-plan.json>',
			},
		});
	} else {
		try {
			const planPath = required(arguments_[0]);
			const plan = planSchema.parse(JSON.parse(readFileSync(planPath, 'utf8')));
			const { clientVersion, revision, music, story } = plan.expectations;
			const expectations =
				music === undefined
					? { story: required(story) }
					: story === undefined
						? { music }
						: { music, story };
			const preflight = inspectRelease({
				...plan.release,
				clientVersion,
				revision,
				expectations,
			});
			writeResult(0, {
				ok: true,
				planPath,
				preflight,
				checksums: [
					checksum(
						`${plan.release.resourceVersionRegistryRoot}/client-res.json`,
					),
					checksum(
						`${plan.release.resourceVersionRegistryRoot}/client-ios-res.json`,
					),
					checksum(plan.release.selectedMasterReleasePath),
					checksum(plan.release.activeMasterDatabasePath),
				],
			});
		} catch (error) {
			writeResult(1, {
				ok: false,
				error: {
					code: 'preflight-failed',
					message: error instanceof Error ? error.message : String(error),
				},
			});
		}
	}
}

if (import.meta.main) runRuntimeReleasePreflight(Bun.argv.slice(2));

function checksum(path: string): Readonly<{
	path: string;
	sha256: string;
}> {
	return {
		path,
		sha256: createHash('sha256').update(readFileSync(path)).digest('hex'),
	};
}

function required<T>(value: T | undefined): T {
	if (value === undefined) throw new Error('Required value is missing');
	return value;
}

function writeResult(exitCode: 0 | 1 | 2, body: object): void {
	process.stdout.write(`${JSON.stringify(body)}\n`);
	process.exitCode = exitCode;
}
