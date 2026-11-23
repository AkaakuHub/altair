import type { Database } from 'bun:sqlite';

const schoolIdolShowTargetContents = 800;
type RhythmGameCampaign = { campaignType: number; effectValue: number };

export function getActiveRhythmGameCampaigns(
	database: Database,
	now: string,
): RhythmGameCampaign[] {
	const rows = database
		.query(
			[
				'SELECT campaign_type, effect_value',
				'FROM master_campaign',
				'WHERE target_contents = ?',
				'AND datetime(start_time) <= datetime(?)',
				'AND datetime(end_time) > datetime(?)',
				'ORDER BY id',
			].join(' '),
		)
		.all(schoolIdolShowTargetContents, now, now) as Array<{
		campaign_type: number;
		effect_value: number;
	}>;
	return rows.map((row) => ({
		campaignType: row.campaign_type,
		effectValue: row.effect_value,
	}));
}

export function getCampaignMultiplier(
	campaigns: readonly RhythmGameCampaign[],
	campaignType: number,
): number {
	const campaign = campaigns.find(
		(entry) => entry.campaignType === campaignType,
	);
	return campaign ? campaign.effectValue / 100 : 1;
}
