import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { createAdminUiViteConfig } from './tools/viteConfig.ts';

export default defineConfig(
	createAdminUiViteConfig({
		rootDirectory: fileURLToPath(new URL('.', import.meta.url)),
	}),
);
