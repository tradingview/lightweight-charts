/**
 * Fills rectangle's inner border (so, all the filled area is limited by the [x, x + width]*[y, y + height] region)
 * ```
 * (x, y)
 * O***********************|*****
 * |        border         |  ^
 * |   *****************   |  |
 * |   |               |   |  |
 * | b |               | b |  h
 * | o |               | o |  e
 * | r |               | r |  i
 * | d |               | d |  g
 * | e |               | e |  h
 * | r |               | r |  t
 * |   |               |   |  |
 * |   *****************   |  |
 * |        border         |  v
 * |***********************|*****
 * |                       |
 * |<------- width ------->|
 * ```
 *
 * @param ctx - Context to draw on
 * @param x - Left side of the target rectangle
 * @param y - Top side of the target rectangle
 * @param width - Width of the target rectangle
 * @param height - Height of the target rectangle
 * @param borderWidth - Width of border to fill, must be less than width and height of the target rectangle
 */
export declare function fillRectInnerBorder(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, borderWidth: number): void;
export declare function clearRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, clearColor: string): void;
export type LeftTopRightTopRightBottomLeftBottomRadii = [number, number, number, number];
export declare function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radii: LeftTopRightTopRightBottomLeftBottomRadii): void;
/**
 * Draws a rounded rect with a border.
 *
 * This function assumes that the colors will be solid, without
 * any alpha. (This allows us to fix a rendering artefact.)
 *
 * @param outerBorderRadius - The radius of the border (outer edge)
 */
export declare function drawRoundRectWithBorder(ctx: CanvasRenderingContext2D, left: number, top: number, width: number, height: number, backgroundColor: string, borderWidth?: number, outerBorderRadius?: LeftTopRightTopRightBottomLeftBottomRadii, borderColor?: string): void;
export declare function clearRectWithGradient(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, topColor: string, bottomColor: string): void;
