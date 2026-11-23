import { type ReactNode, useCallback, useMemo, useRef, useState } from 'react';
import { AdminUnsavedChangesContext } from '../../hooks/useAdminUnsavedChanges.ts';

export function AdminUnsavedChangesProvider({
	children,
}: Readonly<{ children: ReactNode }>): React.ReactElement {
	const [dirtyIds, setDirtyIds] = useState<ReadonlySet<string>>(
		() => new Set<string>(),
	);
	const [hasPendingAction, setHasPendingAction] = useState(false);
	const pendingAction = useRef<(() => void) | null>(null);
	const bypassing = useRef(false);
	const setDirty = useCallback((id: string, dirty: boolean) => {
		setDirtyIds((current) => {
			if (current.has(id) === dirty) return current;
			const next = new Set(current);
			if (dirty) next.add(id);
			else next.delete(id);
			return next;
		});
	}, []);
	const shouldBlockNavigation = useCallback(
		() => dirtyIds.size > 0 && !bypassing.current,
		[dirtyIds],
	);
	const requestAction = useCallback(
		(action: () => void) => {
			if (pendingAction.current !== null) return;
			if (dirtyIds.size === 0) {
				action();
				return;
			}
			pendingAction.current = action;
			setHasPendingAction(true);
		},
		[dirtyIds],
	);
	const cancelAction = useCallback(() => {
		pendingAction.current = null;
		setHasPendingAction(false);
	}, []);
	const discardAction = useCallback(() => {
		const action = pendingAction.current;
		cancelAction();
		if (action === null) return;
		bypassing.current = true;
		try {
			action();
		} finally {
			bypassing.current = false;
		}
	}, [cancelAction]);
	const value = useMemo(
		() => ({
			hasPendingAction,
			setDirty,
			shouldBlockNavigation,
			requestAction,
			cancelAction,
			discardAction,
		}),
		[
			hasPendingAction,
			setDirty,
			shouldBlockNavigation,
			requestAction,
			cancelAction,
			discardAction,
		],
	);
	return (
		<AdminUnsavedChangesContext value={value}>
			{children}
		</AdminUnsavedChangesContext>
	);
}
