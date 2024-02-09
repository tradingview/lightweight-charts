import { PNG } from 'pngjs';
export interface CompareResult {
    diffPixelsCount: number;
    diffImg: PNG;
}
export declare function compareScreenshots(leftImg: PNG, rightImg: PNG): CompareResult;
