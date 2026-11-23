import {
	type ActiveDatabaseBuildPlan,
	type ActiveMasterSourceResult,
	createActiveDatabaseBuildPlan,
} from '../domain/active-database-build.ts';

export type ActiveMasterSource = {
	load(): Promise<ActiveMasterSourceResult>;
};

export type ActiveDatabaseCandidateWriter = {
	writeCandidate(
		candidatePath: string,
		plan: ActiveDatabaseBuildPlan,
	): Promise<void>;
};

export type ActiveDatabaseCandidateVerifier = {
	verifyCandidate(
		candidatePath: string,
		plan: ActiveDatabaseBuildPlan,
	): Promise<void>;
};

export type ActiveDatabaseExchange = {
	exchange(candidatePath: string, activePath: string): Promise<void>;
};

export type ActiveDatabaseCandidatePaths = {
	createCandidatePath(activePath: string): Promise<string>;
	discardCandidate(candidatePath: string): Promise<void>;
};

export class ActiveDatabaseBuilder {
	constructor(
		private readonly ports: Readonly<{
			sources: readonly ActiveMasterSource[];
			writer: ActiveDatabaseCandidateWriter;
			verifier: ActiveDatabaseCandidateVerifier;
			exchange: ActiveDatabaseExchange;
			candidatePaths: ActiveDatabaseCandidatePaths;
		}>,
	) {}

	async buildAndActivate(input: {
		activePath: string;
		releaseIdentity: string;
		builderIdentity: string;
	}): Promise<ActiveDatabaseBuildPlan> {
		const candidatePath = await this.ports.candidatePaths.createCandidatePath(
			input.activePath,
		);
		try {
			const sources: ActiveMasterSourceResult[] = [];
			for (const source of this.ports.sources)
				sources.push(await source.load());
			const plan = createActiveDatabaseBuildPlan({
				releaseIdentity: input.releaseIdentity,
				builderIdentity: input.builderIdentity,
				sources,
			});
			await this.ports.writer.writeCandidate(candidatePath, plan);
			await this.ports.verifier.verifyCandidate(candidatePath, plan);
			await this.ports.exchange.exchange(candidatePath, input.activePath);
			return plan;
		} catch (error) {
			await this.ports.candidatePaths.discardCandidate(candidatePath);
			throw error;
		}
	}
}
