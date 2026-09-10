// github-slugger 1.5.0 ships no types of its own, and there is no @types
// package for it. Only what the catalogue detail page uses is declared: the
// stateful slugger, which numbers a repeated heading text the way GitHub — and
// Docusaurus's own heading ids — do. `export =` because the module is CommonJS
// with a single class as its export.
declare module 'github-slugger' {
	class GithubSlugger {
		/** Anchor id for `value`, suffixed when the same text was seen before. */
		public slug(value: string, maintainCase?: boolean): string;
		/** Forgets every slug handed out so far. */
		public reset(): void;
	}
	export = GithubSlugger;
}
