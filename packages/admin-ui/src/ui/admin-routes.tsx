import type { ReactElement } from 'react';
import { Navigate, type RouteObject, useRoutes } from 'react-router-dom';

type AdminRoutesProps = Readonly<{
	indexElement: ReactElement;
	extensionRoutes?: readonly RouteObject[];
}>;

export function AdminRoutes(props: AdminRoutesProps): ReactElement | null {
	return useRoutes(createAdminRouteObjects(props));
}

export function createAdminRouteObjects({
	indexElement,
	extensionRoutes = [],
}: AdminRoutesProps): RouteObject[] {
	return [
		{ index: true, element: indexElement },
		...extensionRoutes,
		{ path: '*', element: <Navigate to="/" replace /> },
	];
}
