import type { Database } from 'bun:sqlite';
import type { SelectedMasterRelease } from './selected-master-release.ts';

export type ActiveMasterSelection = Readonly<
	Omit<SelectedMasterRelease, 'schemaVersion'> & {
		database: Database;
		platforms?: Readonly<
			Record<
				'android' | 'ios',
				ActiveMasterRouteSelection & { clientVersion: string }
			>
		>;
	}
>;

export type ActiveMasterRepository = Readonly<{
	selection: ActiveMasterSelection;
	close: () => void;
}>;

export type ActiveMasterRouteSelection = Readonly<{
	masterReleaseId: string;
	database: Database;
}>;
