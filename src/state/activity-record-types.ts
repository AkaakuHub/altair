import type { EntityProvenance } from './entity-provenance.ts';

export type ActivityRecordAdvMembership = EntityProvenance & {
	advDataId: number;
};

export type ActivityRecordSeriesMembership = EntityProvenance & {
	advSeriesId: number;
};

export type UserActivityRecordState = {
	playerId: string;
	watchedActivityRecordAdvDataIds: number[];
	displayedActivityRecordAdvSeriesIds: number[];
	unlockedActivityRecordAdvDataIds: number[];
	watchedActivityRecordAdvMemberships?: ActivityRecordAdvMembership[];
	displayedActivityRecordAdvSeriesMemberships?: ActivityRecordSeriesMembership[];
	unlockedActivityRecordAdvMemberships?: ActivityRecordAdvMembership[];
};

export type ActivityRecordVisibleState = Pick<
	UserActivityRecordState,
	| 'playerId'
	| 'watchedActivityRecordAdvDataIds'
	| 'displayedActivityRecordAdvSeriesIds'
	| 'unlockedActivityRecordAdvDataIds'
>;
