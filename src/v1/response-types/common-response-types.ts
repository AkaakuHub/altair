export type NullResponse = null;
export type ResultResponse = { result: boolean };
export type ResultCodeResponse = { resultCode: number };
export type SessionErrorResponse = {
	error_code: string;
	message: string;
	title: string;
};

export type UserStaminaResponse = {
	stamina_now: number;
	stamina_max: number;
	stamina_recovery_time: string | null;
};
