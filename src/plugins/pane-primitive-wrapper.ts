import { IPaneApi } from '../api/ipane-api';
import { IPanePrimitive } from '../api/ipane-primitive-api';

import { DeepPartial } from '../helpers/strict-type-checks';

import { IPrimitiveWrapper } from './primitive-wrapper-base';

/**
 * Interface for a primitive with options.
 */
export interface IPanePrimitiveWithOptions<T, K> extends IPanePrimitive<T> {
	/**
	 * @param options - Options to apply. The options are deeply merged with the current options.
	 */
	applyOptions?: (options: DeepPartial<K>) => void;
}

export class PanePrimitiveWrapper<T, Options = unknown, TPrimitive extends IPanePrimitiveWithOptions<T, Options> = IPanePrimitive<T>> implements IPrimitiveWrapper<T, Options> {
	protected _primitive: TPrimitive;
	protected _pane: IPaneApi<T>;

	public constructor(pane: IPaneApi<T>, primitive: TPrimitive) {
		this._pane = pane;
		this._primitive = primitive;
		this._attach();
	}

	public detach(): void {
		this._pane.detachPrimitive(this._primitive);
	}

	public getPane(): IPaneApi<T> {
		return this._pane;
	}

	public applyOptions(options: DeepPartial<Options>): void {
		this._primitive.applyOptions?.(options);
	}

	private _attach(): void {
		this._pane.attachPrimitive(this._primitive);
	}
}
