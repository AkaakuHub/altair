import type { AdminVisibleServerState } from '@altair/runtime/admin/dto/admin-visible-state-schema.ts';

type SocialDirectoryState = Pick<
	AdminVisibleServerState,
	'registeredUsers' | 'userSocials'
>;

export type ReportRow = {
	playerId: string;
	targetPlayerId: string;
	reportType: number;
	playerName: string;
	targetPlayerName: string;
};

export type MuteRow = {
	playerId: string;
	playerName: string;
	targetPlayerId: string;
	targetPlayerName: string;
};

export function createReportRows(state: SocialDirectoryState): ReportRow[] {
	return state.userSocials.flatMap((social) =>
		social.reportApplications.map((report) => ({
			playerId: social.playerId,
			playerName: playerName(state, social.playerId),
			targetPlayerId: report.playerId,
			targetPlayerName: playerName(state, report.playerId),
			reportType: report.reportType,
		})),
	);
}

export function createMuteRows(state: SocialDirectoryState): MuteRow[] {
	return state.userSocials.flatMap((social) =>
		social.mutePlayerIds.map((targetPlayerId) => ({
			playerId: social.playerId,
			playerName: playerName(state, social.playerId),
			targetPlayerId,
			targetPlayerName: playerName(state, targetPlayerId),
		})),
	);
}

export function filterReportRows(
	reports: ReportRow[],
	query: string,
): ReportRow[] {
	const normalized = query.trim().toLowerCase();
	if (normalized.length === 0) {
		return reports;
	}
	return reports.filter((report) =>
		`${report.playerId} ${report.playerName} ${report.targetPlayerId} ${report.targetPlayerName} ${report.reportType}`
			.toLowerCase()
			.includes(normalized),
	);
}

export function filterMuteRows(mutes: MuteRow[], query: string): MuteRow[] {
	const normalized = query.trim().toLowerCase();
	if (normalized.length === 0) {
		return mutes;
	}
	return mutes.filter((mute) =>
		`${mute.playerId} ${mute.playerName} ${mute.targetPlayerId} ${mute.targetPlayerName}`
			.toLowerCase()
			.includes(normalized),
	);
}

function playerName(state: SocialDirectoryState, playerId: string): string {
	return (
		state.registeredUsers.find((user) => user.playerId === playerId)
			?.playerName ?? ''
	);
}
