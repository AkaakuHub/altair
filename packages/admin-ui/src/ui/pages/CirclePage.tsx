import { CircleEditor } from '../features/circle/CircleEditor.tsx';
import type { AdminPageProps } from '../page-props.ts';

export function CirclePage(props: AdminPageProps): React.ReactElement {
	return <CircleEditor {...props} />;
}
