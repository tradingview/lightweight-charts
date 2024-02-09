import { PNG } from 'pngjs';
export declare class Screenshoter {
    private _browserPromise;
    constructor(noSandbox: boolean, devicePixelRatio?: number);
    close(): Promise<void>;
    generateScreenshot(pageContent: string): Promise<PNG>;
}
