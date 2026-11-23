export type ActivationFlags = Readonly<Record<number, boolean>>;

export function editActivationFlag(
	edits: ActivationFlags,
	source: ActivationFlags,
	id: number,
	enabled: boolean,
): ActivationFlags {
	if (enabled === (source[id] ?? false)) {
		if (!Object.hasOwn(edits, id)) return edits;
		const next = { ...edits };
		delete next[id];
		return next;
	}
	return edits[id] === enabled ? edits : { ...edits, [id]: enabled };
}

export function reconcileActivationEdits(
	edits: ActivationFlags,
	source: ActivationFlags,
): ActivationFlags {
	let next: Record<number, boolean> | null = null;
	for (const [key, enabled] of Object.entries(edits)) {
		const id = Number(key);
		if (enabled === (source[id] ?? false)) {
			next ??= { ...edits };
			delete next[id];
		}
	}
	return next ?? edits;
}
