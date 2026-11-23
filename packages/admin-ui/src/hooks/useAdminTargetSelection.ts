import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import {
	type AdminTargetSelection,
	createAdminTargetSelection,
	editAdminTargetCandidate,
	hasPendingAdminTargetSelection,
	selectAdminTarget,
	synchronizeAdminTargetSelection,
} from '../domain/forms/targetSelection.ts';
import { useAdminUnsavedChangesContext } from './useAdminUnsavedChanges.ts';

export type AdminTargetSelectionControl = AdminTargetSelection &
	Readonly<{
		hasPendingSelection: boolean;
		setCandidateId(candidateId: string): void;
		select(candidateId: string, afterSelect?: () => void): void;
		resetCandidate(): void;
	}>;

function identityTargetId(id: string): string {
	return id;
}

export function useAdminTargetSelection<Form>(
	selectedId: string,
	resolveTarget: (id: string) => Form,
	onSelect: (form: Form) => void,
	normalizeId: (id: string) => string = identityTargetId,
): AdminTargetSelectionControl {
	const { requestAction } = useAdminUnsavedChangesContext();
	const [selection, setSelection] = useState(() =>
		createAdminTargetSelection(selectedId),
	);
	const operations = useRef({ resolveTarget, onSelect, normalizeId });
	useLayoutEffect(() => {
		operations.current = { resolveTarget, onSelect, normalizeId };
	}, [resolveTarget, onSelect, normalizeId]);
	useLayoutEffect(() => {
		setSelection((current) =>
			synchronizeAdminTargetSelection(current, selectedId),
		);
	}, [selectedId]);
	const setCandidateId = useCallback((candidateId: string) => {
		setSelection((current) => editAdminTargetCandidate(current, candidateId));
	}, []);
	const resetCandidate = useCallback(() => {
		setSelection((current) =>
			editAdminTargetCandidate(current, current.selectedId),
		);
	}, []);
	const select = useCallback(
		(candidateId: string, afterSelect?: () => void) => {
			requestAction(() => {
				const current = operations.current;
				const next = selectAdminTarget(
					candidateId,
					current.normalizeId,
					current.resolveTarget,
				);
				current.onSelect(next.form);
				setSelection(next.selection);
				afterSelect?.();
			});
		},
		[requestAction],
	);
	return {
		...selection,
		hasPendingSelection: hasPendingAdminTargetSelection(selection),
		setCandidateId,
		select,
		resetCandidate,
	};
}
