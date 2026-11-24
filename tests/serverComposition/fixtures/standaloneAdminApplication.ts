import { startStandaloneAdminServer } from '../../../packages/admin-server/src/cli/start-admin-server.ts';
import { createStandaloneConfig } from './standaloneConfig.ts';

const archiveRoot = process.argv[2];
if (archiveRoot === undefined)
	throw new Error('Archive fixture root is required');
const { config, database } = createStandaloneConfig(archiveRoot);
const server = startStandaloneAdminServer({
	server: { ...config, port: 0 },
});
const request = (path: string, init?: RequestInit) =>
	fetch(new URL(path, server.url), init);
try {
	const registration = await request('/v1/register/set_new_user', {
		method: 'POST',
		body: JSON.stringify({ platform_type: 1, name: 'Sample User' }),
		headers: { 'content-type': 'application/json' },
	});
	if (!registration.ok)
		throw new Error(`User registration failed: ${await registration.text()}`);
	const admin = await request('/admin/state.json?page=users');
	const page = await request('/admin');
	const script = /<script[^>]*src="([^"]+)"/u.exec(await page.text())?.[1];
	if (script === undefined)
		throw new Error('Admin application entry is missing');
	const javascript = await request(script);
	const unknownStatus = (await request('/admin/unknown')).status;
	console.log(
		JSON.stringify({
			registrationStatus: registration.status,
			adminStatus: admin.status,
			adminState: await admin.json(),
			pageStatus: page.status,
			scriptStatus: javascript.status,
			scriptContentType: javascript.headers.get('content-type'),
			unknownStatus,
		}),
	);
} finally {
	server.stop(true);
	database.close();
}
