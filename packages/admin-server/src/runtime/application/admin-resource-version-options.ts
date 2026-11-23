import type { RuntimeReleaseOption } from '@altair/runtime/admin/dto/runtime-resource-version-schema.ts';
import {
	completeResourceVersionSchema,
	resourceVersionRevision,
} from '../../../../../src/master-archive/domain/resource-version.ts';
import type { ActiveMasterSelection } from '../../../../../src/master-data/active-master-repository.ts';
import {
	type ResourceVersionRegistry,
	resolveResourceVersionProfileForPair,
} from '../../../../../src/resource-versions.ts';

export function listRuntimeReleaseOptions(
	registry: ResourceVersionRegistry,
	active: ActiveMasterSelection,
): RuntimeReleaseOption[] {
	const options: RuntimeReleaseOption[] = [];
	for (const platform of ['android', 'ios'] as const) {
		const activeVersion =
			platform === 'android'
				? active.androidResourceVersion
				: active.iosResourceVersion;
		const clientVersion =
			active.platforms?.[platform].clientVersion ??
			resolveResourceVersionProfileForPair(
				active.androidResourceVersion,
				active.iosResourceVersion,
				registry,
			).clientVersion;
		for (const [client, versions] of Object.entries(registry[platform])) {
			for (const value of versions) {
				const parsed = completeResourceVersionSchema.safeParse(value);
				if (!parsed.success) continue;
				options.push(
					option(
						platform,
						client,
						parsed.data,
						client === clientVersion && parsed.data === activeVersion,
					),
				);
			}
		}
		if (!options.some((entry) => entry.platform === platform && entry.isActive))
			options.push(option(platform, clientVersion, activeVersion, true));
	}
	return options.sort(
		(left, right) =>
			left.platform.localeCompare(right.platform) ||
			right.revision.localeCompare(left.revision) ||
			right.clientVersion.localeCompare(left.clientVersion) ||
			left.id.localeCompare(right.id),
	);
}

export function findRuntimeReleaseOption(
	options: readonly RuntimeReleaseOption[],
	platform: 'android' | 'ios',
	id: string,
): RuntimeReleaseOption | undefined {
	return options.find(
		(entry) => entry.platform === platform && entry.id === id,
	);
}

function option(
	platform: 'android' | 'ios',
	clientVersion: string,
	resourceVersion: string,
	isActive: boolean,
): RuntimeReleaseOption {
	return {
		id: `${platform}:${clientVersion}:${resourceVersion}`,
		platform,
		clientVersion,
		resourceVersion,
		revision: resourceVersionRevision(resourceVersion),
		isActive,
	};
}
