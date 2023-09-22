/**
 * Removes "readonly" from all properties
 */
export type Mutable<T> = {
	-readonly [P in keyof T]: T[P];
};
