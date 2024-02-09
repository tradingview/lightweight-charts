import { Page } from 'puppeteer';
export type InteractionAction = 'scrollLeft' | 'scrollRight' | 'scrollUp' | 'scrollDown' | 'scrollUpRight' | 'scrollDownLeft' | 'click' | 'doubleClick' | 'outsideClick' | 'viewportZoomInOut' | 'verticalDrag' | 'horizontalDrag' | 'tap' | 'longTouch' | 'pinchZoomIn' | 'pinchZoomOut' | 'swipeTouchVertical' | 'swipeTouchHorizontal' | 'swipeTouchDiagonal' | 'kineticAnimation' | 'moveMouseCenter' | 'moveMouseTopLeft' | 'clickXY';
export type InteractionTarget = 'container' | 'timescale' | 'leftpricescale' | 'rightpricescale' | 'pane';
export type Interaction = {
    action: InteractionAction;
    target?: InteractionTarget;
} & ({
    action: Omit<InteractionAction, 'clickXY'>;
    options: never;
} | {
    action: 'clickXY';
    options: {
        x: number;
        y: number;
    };
});
export declare function performInteractions(page: Page, interactionsToPerform: Interaction[]): Promise<void>;
