import { useCallback, useEffect, useMemo, useState } from 'react';
import {
	type ActivationFlags,
	editActivationFlag,
	reconcileActivationEdits,
} from '../domain/forms/activationEdits.ts';
import { useAdminUnsavedChanges } from './useAdminUnsavedChanges.ts';

export function useAdminActivationDraft(source: ActivationFlags) {
	const [edits, setEdits] = useState<ActivationFlags>({});
	useEffect(() => {
		setEdits((current) => reconcileActivationEdits(current, source));
	}, [source]);
	const value = useMemo(() => ({ ...source, ...edits }), [source, edits]);
	const setEnabled = useCallback(
		(id: number, enabled: boolean) => {
			setEdits((current) => editActivationFlag(current, source, id, enabled));
		},
		[source],
	);
	useAdminUnsavedChanges(Object.keys(edits).length > 0);
	return { value, setEnabled };
}
