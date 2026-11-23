import {
	type SetStateAction,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from 'react';
import {
	type AdminDraftChangeDetector,
	type AdminDraftValues,
	createAdminFormDraft,
	editAdminFormDraft,
	hasAdminDraftChanges,
	reconcileAdminFormDraft,
} from '../domain/forms/draft.ts';
import { useAdminUnsavedChanges } from './useAdminUnsavedChanges.ts';

export function useAdminFormDraft<T extends AdminDraftValues>(
	initial: T,
	resolveSource: (value: T) => T | null,
	getKey: (value: T) => string,
	hasChanges: AdminDraftChangeDetector<T> = hasAdminDraftChanges,
) {
	const [draft, setDraft] = useState(() => createAdminFormDraft(initial));
	useEffect(() => {
		setDraft((current) => {
			const source = resolveSource(current.value);
			return source === null
				? current
				: reconcileAdminFormDraft(current, source, hasChanges);
		});
	}, [resolveSource, hasChanges]);
	const setValue = useCallback(
		(value: SetStateAction<T>) => {
			setDraft((current) => {
				const next = typeof value === 'function' ? value(current.value) : value;
				return getKey(current.value) === getKey(next)
					? editAdminFormDraft(current, next, hasChanges)
					: createAdminFormDraft(next);
			});
		},
		[getKey, hasChanges],
	);
	const acceptSaved = useCallback(
		(value: T) => {
			setDraft((current) =>
				getKey(current.value) === getKey(value)
					? createAdminFormDraft(value)
					: current,
			);
		},
		[getKey],
	);
	const reset = useCallback(() => {
		setDraft((current) => {
			const source = resolveSource(current.value);
			return source === null ? current : createAdminFormDraft(source);
		});
	}, [resolveSource]);
	const isDirty = useMemo(
		() => hasChanges(draft.source, draft.value),
		[draft, hasChanges],
	);
	useAdminUnsavedChanges(isDirty);
	return {
		value: draft.value,
		isDirty,
		conflicted: draft.conflicted,
		isAvailable: resolveSource(draft.value) !== null,
		setValue,
		acceptSaved,
		reset,
	};
}
