import { BoxOptions } from '../model/box-options';
import { CustomBox } from '../model/custom-box';

import { IBox } from './ibox';

export class Box implements IBox {
	private readonly _box: CustomBox;

	public constructor(box: CustomBox) {
		this._box = box;
	}

	public applyOptions(options: Partial<BoxOptions>): void {
		this._box.applyOptions(options);
	}
	public options(): Readonly<BoxOptions> {
		return this._box.options();
	}

	public box(): CustomBox {
		return this._box;
	}
}
