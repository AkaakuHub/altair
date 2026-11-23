export const adminMutationCommittedHeader = 'X-Admin-Mutation-Committed';

export class AdminMutationCommittedError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'AdminMutationCommittedError';
	}
}
