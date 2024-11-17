import { BoxOptions } from '../model/box-options';
import { CustomBox } from '../model/custom-box';
import { IBox } from './ibox';
export declare class Box implements IBox {
    private readonly _box;
    constructor(box: CustomBox);
    applyOptions(options: Partial<BoxOptions>): void;
    options(): Readonly<BoxOptions>;
    box(): CustomBox;
}
