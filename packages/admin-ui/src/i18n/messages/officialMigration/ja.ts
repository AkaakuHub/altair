import type { en } from './en.ts';

export const ja = {
	dumpFile: 'ダンプファイル',
	selectZip: 'ダンプZIPを選択',
	password: 'LinkLike IDのパスワード（任意）',
	preview: 'プレビュー',
	applyErrors: '適用エラー',
	noCategories: '移行項目がありません',
	playerId: 'プレイヤーID',
	format: '形式',
	events: 'イベント数',
	endpoint: 'エンドポイント',
	responses: '応答数',
	captured: '保存済み',
	missing: '未保存',
	not_applied: '適用対象外',
	selectedZip: (name: string) => `ダンプZIPを選択: ${name}`,
	applied: (playerId: string, categories: string) =>
		`プレイヤー${playerId}に適用しました。項目: ${categories}`,
} satisfies typeof en;
