import type { en } from './en.ts';

export const zhCN = {
	dumpFile: '转储文件',
	selectZip: '选择转储ZIP',
	password: 'LinkLike ID密码（可选）',
	preview: '预览',
	applyErrors: '应用错误',
	noCategories: '没有迁移项目',
	playerId: '玩家ID',
	format: '格式',
	events: '事件数',
	endpoint: '端点',
	responses: '响应数',
	captured: '已保存',
	missing: '未保存',
	not_applied: '不适用',
	selectedZip: (name: string) => `选择转储ZIP：${name}`,
	applied: (playerId: string, categories: string) =>
		`已应用到玩家${playerId}。项目：${categories}`,
} satisfies typeof en;
