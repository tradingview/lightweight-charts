/**
 * This is the generic type useful for declaring a nominal type,
 * which does not structurally matches with the base type and
 * the other types declared over the same base type
 *
 * @example
 * ```ts
 * type Index = Nominal<number, 'Index'>;
 * // let i: Index = 42; // this fails to compile
 * let i: Index = 42 as Index; // OK
 * ```
 * @example
 * ```ts
 * type TagName = Nominal<string, 'TagName'>;
 * ```
 */
export type Nominal<T, Name extends string> = T & {
	/** The 'name' or species of the nominal. */
	[Symbol.species]: Name;
};
