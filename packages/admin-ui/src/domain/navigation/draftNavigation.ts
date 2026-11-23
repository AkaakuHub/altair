type AdminDraftLocation = Readonly<{ pathname: string; search: string }>;

export function changesAdminDraftTarget(
	current: AdminDraftLocation,
	next: AdminDraftLocation,
): boolean {
	return (
		current.pathname !== next.pathname ||
		new URLSearchParams(current.search).get('projectId') !==
			new URLSearchParams(next.search).get('projectId')
	);
}
