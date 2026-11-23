type CanonicalStateProjectionPort<CanonicalEntry, DefinitionId> = Readonly<{
	readDefinitionId: (entry: CanonicalEntry) => DefinitionId;
	isSupported: (definitionId: DefinitionId) => boolean;
	isEntrySupported?: (entry: CanonicalEntry) => boolean;
}>;

type CanonicalStateProjectionResult<CanonicalEntry, DefinitionId> = Readonly<{
	visibleEntries: CanonicalEntry[];
	hiddenDefinitionIds: DefinitionId[];
}>;

export function projectCanonicalState<CanonicalEntry, DefinitionId>(
	canonicalEntries: readonly CanonicalEntry[],
	port: CanonicalStateProjectionPort<CanonicalEntry, DefinitionId>,
): CanonicalStateProjectionResult<CanonicalEntry, DefinitionId> {
	const visibleEntries: CanonicalEntry[] = [];
	const hiddenDefinitionIds: DefinitionId[] = [];
	for (const entry of canonicalEntries) {
		const definitionId = port.readDefinitionId(entry);
		if (
			port.isSupported(definitionId) &&
			(port.isEntrySupported?.(entry) ?? true)
		) {
			visibleEntries.push(structuredClone(entry));
		} else {
			hiddenDefinitionIds.push(definitionId);
		}
	}
	return { visibleEntries, hiddenDefinitionIds };
}
