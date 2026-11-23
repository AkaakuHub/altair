export type AdminTargetSelection = Readonly<{
	selectedId: string;
	candidateId: string;
}>;

export function createAdminTargetSelection(
	selectedId: string,
): AdminTargetSelection {
	return { selectedId, candidateId: selectedId };
}

export function editAdminTargetCandidate(
	selection: AdminTargetSelection,
	candidateId: string,
): AdminTargetSelection {
	return selection.candidateId === candidateId
		? selection
		: { ...selection, candidateId };
}

export function synchronizeAdminTargetSelection(
	selection: AdminTargetSelection,
	selectedId: string,
): AdminTargetSelection {
	return selection.selectedId === selectedId
		? selection
		: createAdminTargetSelection(selectedId);
}

export function hasPendingAdminTargetSelection(
	selection: AdminTargetSelection,
): boolean {
	return selection.candidateId !== selection.selectedId;
}

export function selectAdminTarget<Form>(
	candidateId: string,
	normalizeId: (id: string) => string,
	resolveTarget: (id: string) => Form,
): Readonly<{ selection: AdminTargetSelection; form: Form }> {
	const selectedId = normalizeId(candidateId);
	return {
		selection: createAdminTargetSelection(selectedId),
		form: resolveTarget(selectedId),
	};
}
