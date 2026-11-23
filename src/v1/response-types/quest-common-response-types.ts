export type QuestMusicInfoResponse = {
	m_musics_id: number;
	is_enable: boolean;
};
export type QuestStageListEntryResponse = {
	stage_id: number;
	clear_status: number;
	is_lock: boolean;
};

export type QuestMemberFanLevelResponse = {
	character_id: number;
	member_fan_level: number;
};
export type QuestSectionSkillResponse = {
	section_no: number;
	section_skills_id: number;
};
