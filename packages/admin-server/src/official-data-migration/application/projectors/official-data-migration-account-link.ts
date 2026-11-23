import type {
	AccountLinkState,
	ServerState,
} from '../../../../../../src/server-state-schema.ts';

export function upsertOfficialDataMigrationAccountLink(
	state: ServerState,
	accountLink: AccountLinkState,
): void {
	state.accountLinks = [
		...state.accountLinks.filter(
			(link) => link.playerId !== accountLink.playerId,
		),
		accountLink,
	];
}
