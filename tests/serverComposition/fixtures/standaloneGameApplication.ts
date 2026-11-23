import { z } from 'zod';
import { createApp } from '../../../src/server.ts';
import { createStandaloneConfig } from './standaloneConfig.ts';
import { verifyStandaloneOnboarding } from './standaloneOnboarding.ts';

const archiveRoot = process.argv[2];
if (archiveRoot === undefined)
	throw new Error('Archive fixture root is required');
const { config, database } = createStandaloneConfig(archiveRoot);

const initial = { userCount: -1, circleIsEmpty: false };
const app = createApp(config, (application, { state }) => {
	if (application.routes.some((route) => route.path.startsWith('/admin/')))
		throw new Error('Admin routes must not be registered');
	initial.userCount = state.registeredUsers.length;
	initial.circleIsEmpty = state.circle === null;
});
const documentResponse = await app.request('/v1/openapi.json');
const documentBody: unknown = await documentResponse.json();
const document = z
	.object({
		paths: z.record(z.string(), z.unknown()),
		components: z.object({ schemas: z.record(z.string(), z.unknown()) }),
	})
	.parse(documentBody);
const typedOperation = z
	.object({
		paths: z.object({
			'/v1/withlive/enter': z.object({
				post: z.object({
					requestBody: z.object({
						content: z.object({
							'application/json': z.object({
								example: z.object({ live_id: z.string() }),
							}),
						}),
					}),
				}),
			}),
		}),
	})
	.parse(documentBody);

const uiResponse = await app.request('/v1/docs/');
const adminResponse = await app.request('/admin/state.json');
const onboarding = await verifyStandaloneOnboarding(app, () =>
	createApp(config),
);
console.log(
	JSON.stringify({
		documentStatus: documentResponse.status,
		contractSchemaCount: Object.keys(document.components.schemas).length,
		typedExample:
			typedOperation.paths['/v1/withlive/enter'].post.requestBody.content[
				'application/json'
			].example,
		uiStatus: uiResponse.status,
		adminStatus: adminResponse.status,
		paths: Object.keys(document.paths),
		initial,
		onboarding,
	}),
);
database.close();
