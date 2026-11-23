import { isRecord } from '../../../../../src/state/json-state-utils.ts';

type AdminActivationEntry = {
	id: number;
	isEnabled: boolean;
};

export function parseAdminActivationEntries(
	value: string,
	idKey: string,
): AdminActivationEntry[] | undefined {
	let parsed: unknown;
	try {
		parsed = JSON.parse(value);
	} catch {
		return undefined;
	}
	if (!Array.isArray(parsed)) {
		return undefined;
	}
	const activations: AdminActivationEntry[] = [];
	for (const item of parsed) {
		if (!isRecord(item)) {
			return undefined;
		}
		const id = item[idKey];
		const isEnabled = item.isEnabled;
		if (
			typeof id !== 'number' ||
			!Number.isSafeInteger(id) ||
			id <= 0 ||
			typeof isEnabled !== 'boolean'
		) {
			return undefined;
		}
		activations.push({ id, isEnabled });
	}
	return activations;
}
