type Mutable<T extends object> = {
    -readonly [K in keyof T]: T[K]
}

export function cloneReadonly<T extends object>(obj: T): Mutable<T> {
	return JSON.parse(JSON.stringify(obj));
}
