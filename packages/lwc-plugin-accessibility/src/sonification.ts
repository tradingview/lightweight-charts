import { Time } from 'lightweight-charts';

/** Everything a sonification needs about the point the keyboard just landed on. */
export interface SonificationNote {
	/** The point's value, or `undefined` when it has none (whitespace). */
	value: number | undefined;
	/** Lowest value in the sonified range (the scoped points). */
	min: number;
	/** Highest value in the sonified range. */
	max: number;
	/** `value` mapped onto 0…1 between `min` and `max`; `0.5` when they are equal. */
	normalized: number;
	/** 0-based index of the point in the active series. */
	index: number;
	/** Number of points in the active series. */
	total: number;
	/** The point's time. */
	time: Time;
}

/** Tuning of {@link createToneSonifier}. */
export interface ToneSonifierOptions {
	/** Frequency (Hz) played for the lowest value. */
	minFrequency?: number;
	/** Frequency (Hz) played for the highest value. */
	maxFrequency?: number;
	/** Length of each note, in seconds. */
	durationSeconds?: number;
	/** Peak gain of a note (0…1). Keep it low: the notes play in quick succession. */
	volume?: number;
}

/**
 * A ready-made {@link AccessibilityPaneOptions.onSonify} handler: plays a short
 * sine tone whose pitch follows the focused point's value, so a series can be
 * heard as well as read.
 *
 * The `AudioContext` is created on the first note (a user gesture has happened
 * by then, as the note follows a key press) and reused afterwards. Returns a
 * function with a `dispose()` to release the audio hardware. Where the Web Audio
 * API is unavailable the handler is a no-op.
 */
export function createToneSonifier(
	options: ToneSonifierOptions = {}
): ((note: SonificationNote) => void) & { dispose: () => void } {
	const minFrequency = options.minFrequency ?? 220;
	const maxFrequency = options.maxFrequency ?? 880;
	const durationSeconds = options.durationSeconds ?? 0.12;
	const volume = options.volume ?? 0.15;
	let context: AudioContext | null = null;

	const play = (note: SonificationNote): void => {
		if (note.value === undefined || typeof AudioContext === 'undefined') {
			return;
		}
		context = context ?? new AudioContext();
		const now = context.currentTime;
		const oscillator = context.createOscillator();
		const gain = context.createGain();
		oscillator.frequency.value = minFrequency + (maxFrequency - minFrequency) * note.normalized;
		// A short ramp at each end instead of a hard start/stop, which clicks.
		gain.gain.setValueAtTime(0, now);
		gain.gain.linearRampToValueAtTime(volume, now + 0.01);
		gain.gain.linearRampToValueAtTime(0, now + durationSeconds);
		oscillator.connect(gain).connect(context.destination);
		oscillator.start(now);
		oscillator.stop(now + durationSeconds);
	};

	play.dispose = (): void => {
		void context?.close();
		context = null;
	};
	return play;
}

/** Maps `value` onto 0…1 within `[min, max]`, tolerating a zero-width range. */
export function normalizeValue(value: number, min: number, max: number): number {
	return max > min ? (value - min) / (max - min) : 0.5;
}
