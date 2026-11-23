type AdminMutationErrorUpdate =
	| Readonly<{ kind: 'clear' }>
	| Readonly<{ kind: 'failure'; cause: unknown }>;

export function publishAdminMutationError(
	update: AdminMutationErrorUpdate,
	onLocalError: (message: string | null) => void,
	onErrorChange?: (message: string | null) => void,
): void {
	const message =
		update.kind === 'clear'
			? null
			: update.cause instanceof Error
				? update.cause.message
				: String(update.cause);
	onLocalError(message);
	onErrorChange?.(message);
}
