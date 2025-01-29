import { IPaneApi } from '../api/ipane-api';
import { IPanePrimitive } from '../api/ipane-primitive-api';

import { DeepPartial } from '../helpers/strict-type-checks';

/**
 * Interface for a primitive with options.
 */
export interface IPanePrimitiveWithOptions<T, K> extends IPanePrimitive<T> {
	/**
	 * @param options - Options to apply. The options are deeply merged with the current options.
	 */
	applyOptions?: (options: DeepPartial<K>) => void;
}

/**
 * Interface for a pane primitive.
 */
export interface IPanePrimitiveWrapper<T, Options> {
	/**
	 * Detaches the plugin from the pane.
	 */
	detach: () => void;
	/**
	 * Returns the current pane.
	 */
	getPane: () => IPaneApi<T>;
	/**
	 * Applies options to the primitive.
	 * @param options - Options to apply. The options are deeply merged with the current options.
	 */
	applyOptions?: (options: DeepPartial<Options>) => void;
}

export class PanePrimitiveWrapper<T, Options = unknown, TPrimitive extends IPanePrimitiveWithOptions<T, Options> = IPanePrimitiveWithOptions<T, Options>> implements IPanePrimitiveWrapper<T, Options> {
	private _primitive: TPrimitive;
	private _pane: IPaneApi<T>;

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
