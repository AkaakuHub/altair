import type { Database } from 'bun:sqlite';
import type { Context } from 'hono';
import type { ActiveMasterSelection } from '../../master-data/active-master-repository.ts';
import { detectResourceVersionPlatform } from '../../resource-versions.ts';
import type { RegisteredUserState } from '../../server-state-schema.ts';

export type RequestMasterReleaseContext = Readonly<{
	platform: 'android' | 'ios' | 'common';
	resourceVersion: string | Readonly<{ android: string; ios: string }>;
	masterReleaseId: string;
	database: Database;
}>;

export function resolveRequestMasterDatabase(
	c: Context,
	user: RegisteredUserState | undefined,
	selection: ActiveMasterSelection,
): RequestMasterReleaseContext {
	const platform = detectResourceVersionPlatform(
		c.req.raw.headers,
		user?.platformType,
	);
	if (platform !== undefined) {
		const master = selection.platforms?.[platform];
		return {
			platform,
			resourceVersion:
				platform === 'android'
					? selection.androidResourceVersion
					: selection.iosResourceVersion,
			masterReleaseId: master?.masterReleaseId ?? selection.releaseId,
			database: master?.database ?? selection.database,
		};
	}
	return {
		platform: 'common',
		resourceVersion: {
			android: selection.androidResourceVersion,
			ios: selection.iosResourceVersion,
		},
		masterReleaseId: selection.releaseId,
		database: selection.database,
	};
}
