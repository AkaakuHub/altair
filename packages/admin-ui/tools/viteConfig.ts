import { rename, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import type { UserConfig } from 'vite';
import { createUiCodeSplittingGroups } from './viteChunkGroups.ts';

type AdminUiBuildOptions = Readonly<{
	rootDirectory: string;
	entries?: Readonly<Record<string, string>>;
	aliases?: Readonly<Record<string, string>>;
	sourceMap?: boolean;
	additionalDedupe?: readonly string[];
	additionalCodeSplittingGroups?: ReturnType<
		typeof createUiCodeSplittingGroups
	>;
	prepareOutput?(directory: string): Promise<void>;
}>;

export function createAdminUiViteConfig(
	options: AdminUiBuildOptions,
): UserConfig {
	const configurationDirectory = fileURLToPath(new URL('.', import.meta.url));
	const outputDirectory = resolve(options.rootDirectory, 'dist');
	const stagingDirectory = resolve(options.rootDirectory, 'dist.next');
	return {
		base: '/admin/ui/',
		plugins: [
			react(),
			{
				name: 'admin-ui-output',
				config(configuration, { command }) {
					if (command !== 'build') return;
					return {
						oxc: { jsx: { development: false } },
						define: {
							...configuration.define,
							'process.env.NODE_ENV': JSON.stringify('production'),
						},
					};
				},
				async writeBundle() {
					await options.prepareOutput?.(stagingDirectory);
					await replaceOutput(stagingDirectory, outputDirectory);
				},
			},
		],
		root: options.rootDirectory,
		publicDir: resolve(configurationDirectory, '../public'),
		resolve: {
			alias: {
				'@': resolve(configurationDirectory, '../../../src'),
				...options.aliases,
			},
			dedupe: [
				'react',
				'react-dom',
				'@mui/material',
				'@emotion/react',
				'@emotion/styled',
				...(options.additionalDedupe ?? []),
			],
		},
		worker: { format: 'es' },
		build: {
			sourcemap: options.sourceMap ?? false,
			assetsInlineLimit: (filePath) =>
				filePath.endsWith('.wasm') ? false : undefined,
			outDir: stagingDirectory,
			emptyOutDir: true,
			rolldownOptions: {
				preserveEntrySignatures: 'allow-extension',
				input: {
					admin: resolve(options.rootDirectory, 'index.html'),
					...options.entries,
				},
				output: {
					codeSplitting: {
						groups: [
							...(options.additionalCodeSplittingGroups ?? []),
							...createUiCodeSplittingGroups(),
						],
					},
				},
			},
		},
	};
}

async function replaceOutput(
	stagingDirectory: string,
	outputDirectory: string,
): Promise<void> {
	const previousDirectory = `${outputDirectory}.previous`;
	await rm(previousDirectory, { recursive: true, force: true });
	let outputExisted = true;
	try {
		await rename(outputDirectory, previousDirectory);
	} catch (cause) {
		if (!isMissingPathError(cause)) throw cause;
		outputExisted = false;
	}
	try {
		await rename(stagingDirectory, outputDirectory);
	} catch (cause) {
		if (outputExisted) await rename(previousDirectory, outputDirectory);
		throw cause;
	}
	await rm(previousDirectory, { recursive: true, force: true });
}

function isMissingPathError(cause: unknown): boolean {
	return cause instanceof Error && 'code' in cause && cause.code === 'ENOENT';
}
