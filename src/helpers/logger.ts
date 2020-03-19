/// <reference types="_build-time-constants" />

export function warn(msg: string): void {
	if (process.env.NODE_ENV === 'development') {
		// tslint:disable-next-line:no-console
		console.warn(msg);
	}
}
