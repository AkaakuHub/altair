import type { ServerState } from '../../server-state-schema.ts';

export type FollowResponseSource = Pick<
	ServerState,
	| 'followRelations'
	| 'registeredUsers'
	| 'userCards'
	| 'userFriendCards'
	| 'userProfileDesigns'
	| 'userProfileSettings'
	| 'userSocials'
	| 'userStatuses'
>;

export type FollowDirectoryState = Pick<
	ServerState,
	'followRelations' | 'registeredUsers' | 'userSocials'
>;
