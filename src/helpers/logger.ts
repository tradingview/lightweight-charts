/// <reference types="_build-time-constants" />

/**
 * @private
 */
export function warn(msg: string): void {
	if (process.env.NODE_ENV === 'development') {
		// eslint-disable-next-line no-console
		console.warn(msg);
	}
}
