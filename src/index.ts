import { serve } from 'bun';
import { loadConfig } from './config.ts';
import { createApp } from './server.ts';

const config = loadConfig();
const app = createApp(config);
const fetch = app.fetch;

serve({
	hostname: config.host,
	port: config.port,
	idleTimeout: 255,
	fetch,
});

console.log(`altair listening on http://${config.host}:${String(config.port)}`);
