import { IPriceFormatter } from './iprice-formatter';
export declare class VolumeFormatter implements IPriceFormatter {
    private readonly _precision;
    constructor(precision: number);
    format(vol: number): string;
    private _formatNumber;
}
