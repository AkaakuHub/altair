export const zhCN = {
	httpFailure: (status: number, message: string) =>
		`管理操作失败（HTTP${status}）。${message}`,
	reloadFailure: (committed: string, message: string) =>
		`${committed} 获取最新状态也失败了。${message}`,
	quantity: (minimum: number, maximum: number) =>
		`数量请输入${minimum}至${maximum}之间的整数。`,
	stars: '星数请输入非负整数。',
	required: (label: string) => `请输入${label}。`,
	number: (label: string) => `请为${label}输入数字。`,
	integer: (label: string) => `请为${label}输入有效整数。`,
	dateTime: '请输入有效的日期和时间。',
	localTime: '指定的本地时间不可用。',
	savedDateTime: '无法读取保存的日期和时间。',
};
