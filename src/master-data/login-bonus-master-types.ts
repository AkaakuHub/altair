export type LoginBonusProgressView = {
	loginBonusId: number;
	receivedCount: number;
	isReceivedToday: boolean;
	identityFingerprint?: EntityIdentityFingerprint;
};

export type LoginBonusMasterSet = {
	loginBonuses: LoginBonusMaster[];
	eventLoginBonuses: LoginBonusMaster[];
	maxDayCountByLoginBonusId: ReadonlyMap<number, number>;
	identityFingerprintsByLoginBonusId: ReadonlyMap<
		number,
		EntityIdentityFingerprint
	>;
};

export type LoginBonusRewardMaster = {
	amount: number;
	name: string;
	rewardId: number;
	rewardType: number;
};

export type LoginBonusReceivedReward = LoginBonusRewardMaster & {
	loginBonusId: number;
	dayCount: number;
};

export type LoginBonusMaster = {
	loginBonusId: number;
	name: string;
	startTime: string;
	endTime: string;
	showOrder: number;
	datas: LoginBonusDataMaster[];
	identityFingerprint: EntityIdentityFingerprint;
};

export type LoginBonusAdminSummaryMaster = {
	loginBonusId: number;
	loginBonusKind: 'normal' | 'event';
	name: string;
	dayCount: number;
	startTime: string;
	endTime: string;
	rewards: LoginBonusAdminRewardSummaryMaster[];
};

export type LoginBonusDataMaster = {
	count: number;
	fileName: string;
	rewards: LoginBonusRewardMaster[];
};

export type LoginBonusAdminRewardSummaryMaster = {
	dayCount: number;
	amount: number;
	name: string;
	rewardId: number;
	rewardType: number;
};

export type LoginBonusRow = {
	id: number;
	name: string;
	login_bonus_reward_series_id: number;
	start_time: string;
	end_time: string;
	row_index: number;
	login_bonus_kind: 'normal' | 'event';
};

export type LoginBonusRewardRow = {
	login_bonus_reward_series_id: number;
	day_count: number;
	reward_type: number;
	reward_id: number;
	reward_num: number;
	reward_name: string;
};

import type { EntityIdentityFingerprint } from '../state/entity-provenance.ts';
