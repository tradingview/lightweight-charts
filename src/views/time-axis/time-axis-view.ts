import { TimeAxisViewRenderer } from '../../renderers/time-axis-view-renderer';

export abstract class TimeAxisView {
	protected _text: string = '';
	protected _background: string = '#585858';
	protected _coordinate: number = 0;

	public text(): string {
		return this._text;
	}

	public background(): string {
		return this._background;
	}

	public coordinate(): number {
		return this._coordinate;
	}

	public abstract renderer(): TimeAxisViewRenderer;
}
