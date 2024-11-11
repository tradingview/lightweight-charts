import { IPanePrimitive, PaneAttachedParameter } from '../api/ipane-primitive-api';

import { DeepPartial } from '../helpers/strict-type-checks';

export abstract class PrimitiveWrapper<T, Options = unknown> {
	protected _primitive: IPanePrimitive<T>;
	protected _options: Options;

	public constructor(primitive: IPanePrimitive<T>, options: Options) {
		this._primitive = primitive;
		this._options = options;
	}

	public detach(): void {
		this._primitive.detached?.();
	}

	public abstract applyOptions(options: DeepPartial<Options>): void;

	protected _attachToPrimitive(params: PaneAttachedParameter<T>): void {
		this._primitive.attached?.(params);
	}

	protected _requestUpdate(): void {
		this._primitive.updateAllViews?.();
	}
}
