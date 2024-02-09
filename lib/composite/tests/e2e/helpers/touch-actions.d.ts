import { ElementHandle, Page, type CDPSession } from 'puppeteer';
export declare function doLongTouch(page: Page, element: ElementHandle, duration: number): Promise<void>;
export declare function doSwipeTouch(devToolsSession: CDPSession, element: ElementHandle, { horizontal, vertical, }: {
    horizontal?: boolean;
    vertical?: boolean;
}): Promise<void>;
export declare function doPinchZoomTouch(devToolsSession: CDPSession, element: ElementHandle, zoom?: boolean): Promise<void>;
