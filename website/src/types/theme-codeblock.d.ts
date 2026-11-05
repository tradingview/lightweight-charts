// The enhanced-codeblock plugin swizzles `@theme/CodeBlock` and adds named
// exports to it that the theme's own declaration does not know about. The
// examples gallery uses them to prepare a code file the way the code block does
// before it runs it.
declare module '@theme/CodeBlock' {
	/** An example's code as an example page shows and runs it, in a theme's colors. */
	export function prepareExampleScript(code: string, isDarkTheme: boolean): string;
}

declare module '@theme/CodeBlock/chart' {
	export { Chart } from '@site/plugins/enhanced-codeblock/theme/CodeBlock/chart';
}
