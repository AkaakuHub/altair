import { createContext, useContext, useId, useLayoutEffect } from 'react';

export type AdminUnsavedChanges = Readonly<{
	hasPendingAction: boolean;
	setDirty(id: string, dirty: boolean): void;
	shouldBlockNavigation(): boolean;
	requestAction(action: () => void): void;
	cancelAction(): void;
	discardAction(): void;
}>;

export const AdminUnsavedChangesContext =
	createContext<AdminUnsavedChanges | null>(null);

export function useAdminUnsavedChangesContext(): AdminUnsavedChanges {
	const context = useContext(AdminUnsavedChangesContext);
	if (context === null)
		throw new Error('AdminUnsavedChangesProvider is missing');
	return context;
}

export function useAdminUnsavedChanges(dirty: boolean): void {
	const id = useId();
	const { setDirty } = useAdminUnsavedChangesContext();
	useLayoutEffect(() => {
		setDirty(id, dirty);
		return () => setDirty(id, false);
	}, [dirty, id, setDirty]);
}
