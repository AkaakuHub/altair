import type { getRhythmGameHome } from '../active-master-database/rhythm-game-home-responses.ts';
import type {
	setRhythmGameFinish,
	setRhythmGameStart,
} from '../active-master-database/rhythm-game-live-responses.ts';
export type RhythmGameStartResponse = ReturnType<
	typeof setRhythmGameStart
>['body'];
export type RhythmGameFinishResponse = NonNullable<
	ReturnType<typeof setRhythmGameFinish>
>['body'];
export type RhythmGameHomeResponse = ReturnType<
	typeof getRhythmGameHome
>['body'];
export type RhythmGameStartRequest = {
	music_id?: number;
	music_score_difficulty?: number;
	consume_stamina_magnification?: number;
};
export type RhythmGameFinishRequest = {
	score?: number;
	technical_score?: number;
	notes_result_list?: { judgement_result: number }[];
};
