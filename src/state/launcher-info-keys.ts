export const launcherInfoKeys = [
	'quest_live_status',
	'archive_status',
	'activity_status',
	'gacha_status',
	'mission_status',
	'present_box_status',
	'shop_status',
	'sisca_store_status',
	'collection_status',
	'sticker_status',
	'comic_status',
	'circle_status',
	'information_status',
	'friend_status',
	'train_status',
	'deck_status',
	'school_idol_show_status',
] as const;

export const editableLauncherInfoKeys = launcherInfoKeys.filter(
	(key) => key !== 'circle_status',
);
