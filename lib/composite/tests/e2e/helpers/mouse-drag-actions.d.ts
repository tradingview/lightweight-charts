import { ElementHandle, Page } from 'puppeteer';
export declare function doVerticalDrag(page: Page, element: ElementHandle): Promise<void>;
export declare function doHorizontalDrag(page: Page, element: ElementHandle): Promise<void>;
export declare function doKineticAnimation(page: Page, element: ElementHandle): Promise<void>;
