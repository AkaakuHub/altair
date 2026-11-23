import { useCallback, useState } from 'react';
import { publishAdminMutationError } from '../domain/forms/mutationError.ts';

export function useAdminMutationError(
	onErrorChange?: (message: string | null) => void,
) {
	const [error, setError] = useState<string | null>(null);
	const reportError = useCallback(
		(cause: unknown) => {
			publishAdminMutationError(
				{ kind: 'failure', cause },
				setError,
				onErrorChange,
			);
		},
		[onErrorChange],
	);
	const clearError = useCallback(() => {
		publishAdminMutationError({ kind: 'clear' }, setError, onErrorChange);
	}, [onErrorChange]);
	return { error, reportError, clearError };
}
