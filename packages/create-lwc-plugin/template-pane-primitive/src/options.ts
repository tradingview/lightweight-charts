//* The corner of the pane that the label is drawn in.
export type _CLASSNAME_Corner =
	| 'top-left'
	| 'top-right'
	| 'bottom-left'
	| 'bottom-right';

export interface _CLASSNAME_Options {
	//* Define the options for the pane primitive.
	text: string;
	corner: _CLASSNAME_Corner;
	color: string;
	backgroundColor: string;
	borderColor: string;
	fontSize: number;
	fontFamily: string;
	/** Space between the text and the edge of its background, in pixels. */
	padding: number;
	/** Space between the background and the edge of the pane, in pixels. */
	margin: number;
	borderRadius: number;
}

export const defaultOptions: _CLASSNAME_Options = {
	//* Define the default values for all the pane primitive options.
	text: '',
	corner: 'top-left',
	color: 'rgba(19, 23, 34, 1)',
	backgroundColor: 'rgba(255, 255, 255, 0.85)',
	borderColor: 'rgba(19, 23, 34, 0.15)',
	fontSize: 12,
	fontFamily: `-apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif`,
	padding: 6,
	margin: 8,
	borderRadius: 4,
} as const;
