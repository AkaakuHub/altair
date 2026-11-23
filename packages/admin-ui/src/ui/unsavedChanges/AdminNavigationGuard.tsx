import { useCallback } from 'react';
import {
	type BlockerFunction,
	useBeforeUnload,
	useBlocker,
} from 'react-router-dom';
import { changesAdminDraftTarget } from '../../domain/navigation/draftNavigation.ts';
import { useAdminUnsavedChangesContext } from '../../hooks/useAdminUnsavedChanges.ts';
import { DiscardChangesDialog } from '../components/DiscardChangesDialog.tsx';

export function AdminNavigationGuard(): React.ReactElement {
	const {
		hasPendingAction,
		shouldBlockNavigation,
		cancelAction,
		discardAction,
	} = useAdminUnsavedChangesContext();
	const shouldBlock = useCallback<BlockerFunction>(
		({ currentLocation, nextLocation }) =>
			shouldBlockNavigation() &&
			changesAdminDraftTarget(currentLocation, nextLocation),
		[shouldBlockNavigation],
	);
	const blocker = useBlocker(shouldBlock);
	useBeforeUnload(
		useCallback(
			(event: BeforeUnloadEvent) => {
				if (shouldBlockNavigation()) event.preventDefault();
			},
			[shouldBlockNavigation],
		),
	);
	return (
		<DiscardChangesDialog
			open={hasPendingAction || blocker.state === 'blocked'}
			onCancel={() => {
				cancelAction();
				if (blocker.state === 'blocked') blocker.reset();
			}}
			onDiscard={() => {
				if (blocker.state === 'blocked') {
					cancelAction();
					blocker.proceed();
				} else discardAction();
			}}
		/>
	);
}
