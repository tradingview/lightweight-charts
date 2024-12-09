import { IPaneApi } from '../../api/ipane-api';
import {
	IPanePrimitive,
	PaneAttachedParameter,
} from '../../api/ipane-primitive-api';

import { DeepPartial } from '../../helpers/strict-type-checks';

import { IPanePrimitivePaneView } from '../../model/ipane-primitive';

import { IPanePrimitiveWithOptions, IPanePrimitiveWrapper, PanePrimitiveWrapper } from '../pane-primitive-wrapper';
import { IPrimitiveWithOptions } from '../primitive-wrapper-base';
import { PrimitiveHasApplyOptions } from '../types';
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

class TextWatermark<T> implements IPanePrimitive<T>, IPrimitiveWithOptions<TextWatermarkOptions> {
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

	public attached({ requestUpdate }: PaneAttachedParameter<T>): void {
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

export type ITextWatermarkPluginApi<T> = PrimitiveHasApplyOptions<IPanePrimitiveWrapper<T, TextWatermarkOptions>>;

/**
 * Creates an image watermark.
 *
 * @param pane - Target pane.
 * @param options - Watermark options.
 *
 * @returns Image watermark wrapper.
 *
 * @example
 * ```js
 * import { createTextWatermark } from 'lightweight-charts';
 *
 * const firstPane = chart.panes()[0];
 * const textWatermark = createTextWatermark(firstPane, {
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
 * });
 * // to change options
 * textWatermark.applyOptions({ horzAlign: 'left' });
 * // to remove watermark from the pane
 * textWatermark.detach();
 * ```
 */
export function createTextWatermark<T>(pane: IPaneApi<T>, options: DeepPartial<TextWatermarkOptions>): ITextWatermarkPluginApi<T> {
	return new PanePrimitiveWrapper<T, TextWatermarkOptions, IPanePrimitiveWithOptions<T, TextWatermarkOptions>>(pane, new TextWatermark(options));
}
