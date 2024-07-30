import {
	IPanePrimitive,
	PaneAttachedParameter,
} from '../../api/ipane-primitive-api';

import { DeepPartial } from '../../helpers/strict-type-checks';

import { IPanePrimitivePaneView } from '../../model/ipane-primitive';

import {
	TextWatermarkLineOptions,
	textWatermarkLineOptionsDefaults,
	TextWatermarkOptions,
	textWatermarkOptionsDefaults,
} from './options';
import { TextWatermarkPaneView } from './pane-view';

function mergeLineOptionsWithDefaults(
	options: Partial<TextWatermarkLineOptions>
): TextWatermarkLineOptions {
	return {
		...textWatermarkLineOptionsDefaults,
		...options,
	};
}

function mergeOptionsWithDefaults(
	options: DeepPartial<TextWatermarkOptions>
): TextWatermarkOptions {
	return {
		...textWatermarkOptionsDefaults,
		...options,
		lines: options.lines?.map(mergeLineOptionsWithDefaults) ?? [],
	};
}

/**
 * A pane primitive for rendering a text watermark.
 *
 * @example
 * ```js
 *  const textWatermark = new TextWatermark({
 * 	  horzAlign: 'center',
 * 	  vertAlign: 'center',
 * 	  lines: [
 * 	    {
 * 	      text: 'Hello',
 * 	      color: 'rgba(255,0,0,0.5)',
 * 	      fontSize: 100,
 * 	      fontStyle: 'bold',
 * 	    },
 * 	    {
 * 	      text: 'This is a text watermark',
 * 	      color: 'rgba(0,0,255,0.5)',
 * 	      fontSize: 50,
 * 	      fontStyle: 'italic',
 * 	      fontFamily: 'monospace',
 * 	    },
 * 	  ],
 *  });
 * chart.panes()[0].attachPrimitive(textWatermark);
 * ```
 */
export class TextWatermark implements IPanePrimitive<unknown> {
	public requestUpdate?: () => void;
	private _paneViews: TextWatermarkPaneView[];
	private _options: TextWatermarkOptions;

	public constructor(options: DeepPartial<TextWatermarkOptions>) {
		this._options = mergeOptionsWithDefaults(options);
		this._paneViews = [new TextWatermarkPaneView(this._options)];
	}

	public updateAllViews(): void {
		this._paneViews.forEach((pw: TextWatermarkPaneView) =>
			pw.update(this._options)
		);
	}

	public paneViews(): readonly IPanePrimitivePaneView[] {
		return this._paneViews;
	}

	public attached({ requestUpdate }: PaneAttachedParameter<unknown>): void {
		this.requestUpdate = requestUpdate;
	}

	public detached(): void {
		this.requestUpdate = undefined;
	}

	public applyOptions(options: DeepPartial<TextWatermarkOptions>): void {
		this._options = mergeOptionsWithDefaults({ ...this._options, ...options });
		if (this.requestUpdate) {
			this.requestUpdate();
		}
	}
}
