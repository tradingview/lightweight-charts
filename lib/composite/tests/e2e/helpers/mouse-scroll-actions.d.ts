import { ElementHandle, Page } from 'puppeteer';
export declare function centerMouseOnElement(page: Page, element: ElementHandle): Promise<void>;
interface MouseScrollDelta {
    x?: number;
    y?: number;
}
export declare function doMouseScroll(deltas: MouseScrollDelta, page: Page): Promise<void>;
export declare function doMouseScrolls(page: Page, element: ElementHandle): Promise<void>;
export {};
