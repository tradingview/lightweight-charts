/// <reference types="_build-time-constants" />
export function warn(msg) {
    if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn(msg);
    }
}
