import { ensureNotNull } from './assertions';
import { isNumber } from './strict-type-checks';

const fontSizeRegex = /(\d+(?:\.\d+)?)(px|em|rem|pt)/g;

// tslint:disable-next-line:no-any
const context = document.createElement('canvas').getContext('2d') || {} as any;
const backingStore = context.backingStorePixelRatio ||
	context.webkitBackingStorePixelRatio ||
	context.mozBackingStorePixelRatio ||
	context.msBackingStorePixelRatio ||
	context.oBackingStorePixelRatio ||
	context.backingStorePixelRatio || 1;

const currentRatio = (window.devicePixelRatio || 1) / backingStore;

export function getContext2d(canvasElement: HTMLCanvasElement): CanvasRenderingContext2D | null {
	if (canvasElement.width !== Math.floor(parseInt(ensureNotNull(canvasElement.style.width)) * currentRatio)) {
		canvasElement.style.width = canvasElement.width + 'px';
		canvasElement.width *= currentRatio;
		canvasElement.height *= currentRatio;
	}

	const originalContext = canvasElement.getContext('2d');
	return originalContext === null ? null : new CanvasWrapper(originalContext, currentRatio);
}

// BEWARE: it's important to call CanvasRenderingContext2D methods with proper arguments number
// it's not safe to call overloaded method with less arguments number using trailing undefined params
// in this case this method can do nothing at all
// see fillText as an example

export class CanvasWrapper implements CanvasRenderingContext2D {
	public readonly canvas: HTMLCanvasElement;
	private readonly _ctx: CanvasRenderingContext2D;
	private readonly _rto: number; // ratio

	public constructor(originalContext: CanvasRenderingContext2D, ratio: number) {
		this.canvas = originalContext.canvas;
		this._ctx = originalContext;
		this._rto = ratio;
	}

	public restore(): void {
		this._ctx.restore();
	}

	public save(): void {
		this._ctx.save();
	}

	public getTransform(): DOMMatrix {
		return this._ctx.getTransform();
	}

	public resetTransform(): void {
		this._ctx.resetTransform();
	}

	public rotate(angle: number): void {
		this._ctx.rotate(angle);
	}

	public scale(x: number, y: number): void {
		this._ctx.scale(x, y);
	}

	public setTransform(transform?: DOMMatrix2DInit): void;
	public setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void;
	public setTransform(a: number | DOMMatrix2DInit | undefined, b?: number, c?: number, d?: number, e?: number, f?: number): void {
		if (isNumber(a)) {
			this._ctx.setTransform(a, b as number, c as number, d as number, e as number, f as number);
		} else {
			this._ctx.setTransform(a);
		}
	}

	public transform(a: number, b: number, c: number, d: number, e: number, f: number): void {
		this._ctx.transform(a, b, c, d, e, f);
	}

	public translate(x: number, y: number): void {
		this._ctx.translate(x * this._rto, y * this._rto);
	}

	public get globalAlpha(): number {
		return this._ctx.globalAlpha;
	}

	public set globalAlpha(value: number) {
		this._ctx.globalAlpha = value;
	}

	public get globalCompositeOperation(): string {
		return this._ctx.globalCompositeOperation;
	}

	public set globalCompositeOperation(value: string) {
		this._ctx.globalCompositeOperation = value;
	}

	public get imageSmoothingEnabled(): boolean {
		return this._ctx.imageSmoothingEnabled;
	}

	public set imageSmoothingEnabled(value: boolean) {
		this._ctx.imageSmoothingEnabled = value;
	}

	public get imageSmoothingQuality(): ImageSmoothingQuality {
		return this._ctx.imageSmoothingQuality;
	}

	public set imageSmoothingQuality(value: ImageSmoothingQuality) {
		this._ctx.imageSmoothingQuality = value;
	}

	public get fillStyle(): string | CanvasGradient | CanvasPattern {
		return this._ctx.fillStyle;
	}

	public set fillStyle(value: string | CanvasGradient | CanvasPattern) {
		this._ctx.fillStyle = value;
	}

	public get strokeStyle(): string | CanvasGradient | CanvasPattern {
		return this._ctx.strokeStyle;
	}

	public set strokeStyle(value: string | CanvasGradient | CanvasPattern) {
		this._ctx.strokeStyle = value;
	}

	public createLinearGradient(x0: number, y0: number, x1: number, y1: number): CanvasGradient {
		return this._ctx.createLinearGradient(x0 * this._rto, y0 * this._rto, x1 * this._rto, y1 * this._rto);
	}

	public createPattern(image: CanvasImageSource, repetition: string): CanvasPattern | null {
		return this._ctx.createPattern(image, repetition);
	}

	public createRadialGradient(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number): CanvasGradient {
		return this._ctx.createRadialGradient(x0 * this._rto, y0 * this._rto, r0 * this._rto, x1 * this._rto, y1 * this._rto, r1 * this._rto);
	}

	public get shadowBlur(): number {
		return this._ctx.shadowBlur;
	}

	public set shadowBlur(value: number) {
		this._ctx.shadowBlur = value;
	}

	public get shadowColor(): string {
		return this._ctx.shadowColor;
	}

	public set shadowColor(value: string) {
		this._ctx.shadowColor = value;
	}

	public get shadowOffsetX(): number {
		return this._ctx.shadowOffsetX;
	}

	public set shadowOffsetX(value: number) {
		this._ctx.shadowOffsetX = value;
	}

	public get shadowOffsetY(): number {
		return this._ctx.shadowOffsetY;
	}

	public set shadowOffsetY(value: number) {
		this._ctx.shadowOffsetY = value;
	}

	public get filter(): string {
		return this._ctx.filter;
	}

	public set filter(value: string) {
		this._ctx.filter = value;
	}

	public clearRect(x: number, y: number, w: number, h: number): void {
		this._ctx.clearRect(x * this._rto, y * this._rto, w * this._rto, h * this._rto);
	}

	public fillRect(x: number, y: number, w: number, h: number): void {
		this._ctx.fillRect(x * this._rto, y * this._rto, w * this._rto, h * this._rto);
	}

	public strokeRect(x: number, y: number, w: number, h: number): void {
		this._ctx.strokeRect(x * this._rto, y * this._rto, w * this._rto, h * this._rto);
	}

	public beginPath(): void {
		this._ctx.beginPath();
	}

	public clip(fillRule?: CanvasFillRule): void;
	public clip(path: Path2D, fillRule?: CanvasFillRule): void;
	public clip(path: Path2D | CanvasFillRule | undefined, fillRule?: CanvasFillRule): void {
		if (path === 'nonzero' || path === 'evenodd' || path === undefined) {
			this._ctx.clip(path);
		} else {
			this._ctx.clip(path, fillRule);
		}
	}

	public fill(fillRule?: CanvasFillRule): void;
	public fill(path: Path2D, fillRule?: CanvasFillRule): void;
	public fill(path: Path2D | CanvasFillRule | undefined, fillRule?: CanvasFillRule): void {
		if (path === 'nonzero' || path === 'evenodd' || path === undefined) {
			this._ctx.fill(path);
		} else {
			this._ctx.fill(path, fillRule);
		}
	}

	public isPointInPath(x: number, y: number, fillRule?: CanvasFillRule): boolean;
	public isPointInPath(path: Path2D, x: number, y: number, fillRule?: CanvasFillRule): boolean;
	public isPointInPath(path: Path2D | number, x: number, y: number | CanvasFillRule | undefined, fillRule?: CanvasFillRule): boolean {
		return isNumber(path) ?
			this._ctx.isPointInPath(path * this._rto, x * this._rto, y as CanvasFillRule) :
			this._ctx.isPointInPath(path, x * this._rto, (y as number) * this._rto, fillRule);
	}

	public isPointInStroke(x: number, y: number): boolean;
	public isPointInStroke(path: Path2D, x: number, y: number): boolean;
	public isPointInStroke(path: Path2D | number, x: number, y?: number): boolean {
		return isNumber(path) ?
			this._ctx.isPointInStroke(path * this._rto, x * this._rto) :
			this._ctx.isPointInStroke(path, x * this._rto, (y as number) * this._rto);
	}
	public stroke(): void;
	public stroke(path: Path2D): void;
	public stroke(path?: Path2D): void {
		if (path === undefined) {
			this._ctx.stroke();
			return;
		}
		this._ctx.stroke(path);
	}

	public drawFocusIfNeeded(element: Element): void;
	public drawFocusIfNeeded(path: Path2D, element: Element): void;
	public drawFocusIfNeeded(path: Path2D | Element, element?: Element): void {
		if (element !== undefined) {
			this._ctx.drawFocusIfNeeded(path as Path2D, element);
		} else {
			this._ctx.drawFocusIfNeeded(path as Element);
		}
	}

	public scrollPathIntoView(): void;
	public scrollPathIntoView(path: Path2D): void;
	public scrollPathIntoView(path?: Path2D): void {
		if (path !== undefined) {
			this._ctx.scrollPathIntoView(path);
		} else {
			this._ctx.scrollPathIntoView();
		}

	}

	public fillText(text: string, x: number, y: number, maxWidth?: number): void {
		if (this._rto !== 1) {
			this.font = this.font.replace(
				fontSizeRegex, (w: string, m: number, u: string) => {
					return (m * this._rto) + u;
				}
			);
		}

		if (maxWidth === undefined) {
			this._ctx.fillText(text, x * this._rto, y * this._rto);
		} else {
			this._ctx.fillText(text, x * this._rto, y * this._rto, maxWidth * this._rto);
		}

		if (this._rto !== -1) {
			this.font = this.font.replace(
				fontSizeRegex, (w: string, m: number, u: string) => {
					return (m / this._rto) + u;
				}
			);
		}
	}

	public measureText(text: string): TextMetrics {
		return this._ctx.measureText(text);
	}

	public strokeText(text: string, x: number, y: number, maxWidth?: number): void {
		if (this._rto !== 1) {
			this.font = this.font.replace(
				fontSizeRegex, (w: string, m: number, u: string) => {
					return (m * this._rto) + u;
				}
			);
		}

		if (maxWidth === undefined) {
			this._ctx.strokeText(text, x * this._rto, y * this._rto);
		} else {
			this._ctx.strokeText(text, x * this._rto, y * this._rto, maxWidth * this._rto);
		}

		if (this._rto !== 1) {
			this.font = this.font.replace(
				fontSizeRegex, (w: string, m: number, u: string) => {
					return (m / this._rto) + u;
				}
			);
		}
	}

	public drawImage(image: CanvasImageSource, dx: number, dy: number): void;
	public drawImage(image: CanvasImageSource, dx: number, dy: number, dw: number, dh: number): void;
	// tslint:disable-next-line:max-params
	public drawImage(image: CanvasImageSource, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number): void;
	// tslint:disable-next-line:max-params
	public drawImage(image: CanvasImageSource, sx: number, sy: number, sw?: number, sh?: number, dx?: number, dy?: number, dw?: number, dh?: number): void {
		if (image instanceof HTMLCanvasElement) {
			return this._drawImagePatchedSourceAndDest(image, sx, sy, sw as number, sh as number, dx as number, dy as number, dw as number, dh as number);
		} else {
			return this._drawImagePatchedSource(image, sx, sy, sw as number, sh as number, dx as number, dy as number, dw as number, dh as number);
		}
	}

	public createImageData(sw: number, sh: number): ImageData;
	public createImageData(imagedata: ImageData): ImageData;
	public createImageData(sw: number | ImageData, sh?: number): ImageData {
		if (isNumber(sw)) {
			return this._ctx.createImageData(sw, sh as number);
		}
		return this._ctx.createImageData(sw);
	}

	public getImageData(sx: number, sy: number, sw: number, sh: number): ImageData {
		return this._ctx.getImageData(sx, sy, sw, sh);
	}

	public putImageData(imagedata: ImageData, dx: number, dy: number): void;
	// tslint:disable-next-line:max-params
	public putImageData(imagedata: ImageData, dx: number, dy: number, dirtyX: number, dirtyY: number, dirtyWidth: number, dirtyHeight: number): void;
	// tslint:disable-next-line:max-params
	public putImageData(imagedata: ImageData, dx: number, dy: number, dirtyX?: number, dirtyY?: number, dirtyWidth?: number, dirtyHeight?: number): void {
		if (dirtyX === undefined) {
			this._ctx.putImageData(imagedata, dx, dy);
		} else {
			this._ctx.putImageData(imagedata, dx, dy, dirtyX, dirtyY as number, dirtyWidth as number, dirtyHeight as number);
		}
	}

	public get lineCap(): CanvasLineCap {
		return this._ctx.lineCap;
	}

	public set lineCap(value: CanvasLineCap) {
		this._ctx.lineCap = value;
	}

	public get lineDashOffset(): number {
		return this._ctx.lineDashOffset;
	}

	public set lineDashOffset(value: number) {
		this._ctx.lineDashOffset = value;
	}

	public get lineJoin(): CanvasLineJoin {
		return this._ctx.lineJoin;
	}

	public set lineJoin(value: CanvasLineJoin) {
		this._ctx.lineJoin = value;
	}

	public get lineWidth(): number {
		return this._ctx.lineWidth;
	}

	public set lineWidth(value: number) {
		this._ctx.lineWidth = value;
	}

	public get miterLimit(): number {
		return this._ctx.miterLimit;
	}

	public set miterLimit(value: number) {
		this._ctx.miterLimit = value;
	}

	public getLineDash(): number[] {
		return this._ctx.getLineDash();
	}

	public setLineDash(segments: number[]): void {
		this._ctx.setLineDash(segments);
	}

	public get direction(): CanvasDirection {
		return this._ctx.direction;
	}

	public set direction(value: CanvasDirection) {
		this._ctx.direction = value;
	}

	public get font(): string {
		return this._ctx.font;
	}

	public set font(value: string) {
		this._ctx.font = value;
	}

	public get textAlign(): CanvasTextAlign {
		return this._ctx.textAlign;
	}

	public set textAlign(value: CanvasTextAlign) {
		this._ctx.textAlign = value;
	}

	public get textBaseline(): CanvasTextBaseline {
		return this._ctx.textBaseline;
	}

	public set textBaseline(value: CanvasTextBaseline) {
		this._ctx.textBaseline = value;
	}

	public arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean): void {
		this._ctx.arc(x * this._rto, y * this._rto, radius * this._rto, startAngle, endAngle, anticlockwise);
	}

	public arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void {
		this._ctx.arcTo(x1 * this._rto, y1 * this._rto, x2 * this._rto, y2 * this._rto, radius * this._rto);
	}

	public bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void {
		this._ctx.bezierCurveTo(cp1x * this._rto, cp1y * this._rto, cp2x * this._rto, cp2y * this._rto, x * this._rto, y * this._rto);
	}

	public closePath(): void {
		this._ctx.closePath();
	}

	// tslint:disable-next-line:max-params
	public ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, anticlockwise?: boolean): void {
		this._ctx.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise);
	}

	public lineTo(x: number, y: number): void {
		this._ctx.lineTo(x * this._rto, y * this._rto);
	}

	public moveTo(x: number, y: number): void {
		this._ctx.moveTo(x * this._rto, y * this._rto);
	}

	public quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
		this._ctx.quadraticCurveTo(cpx * this._rto, cpy * this._rto, x * this._rto, y * this._rto);
	}

	public rect(x: number, y: number, w: number, h: number): void {
		this._ctx.rect(x * this._rto, y * this._rto, w * this._rto, h * this._rto);
	}

	// tslint:disable-next-line:max-params
	private _drawImageImpl(image: CanvasImageSource, sx: number, sy: number, sw?: number, sh?: number, dx?: number, dy?: number, dw?: number, dh?: number): void {
		if (sw === undefined) {
			this._ctx.drawImage(image, sx, sy);
		} else if (dx === undefined) {
			this._ctx.drawImage(image, sx, sy, sw, sh as number);
		} else {
			this._ctx.drawImage(image, sx, sy, sw, sh as number, dx, dy as number, dw as number, dh as number);
		}
	}

	// there is a special case for retina
	// if source argument is a canvas, we should not
	// tslint:disable-next-line:max-params
	private _drawImagePatchedSource(image: CanvasImageSource, sx: number, sy: number, sw?: number, sh?: number, dx?: number, dy?: number, dw?: number, dh?: number): void {
		this._drawImageImpl(
			image,
			sx * this._rto,
			sy * this._rto,
			sw === undefined ? sw : sw * this._rto,
			sh === undefined ? sh : sh * this._rto,
			dx === undefined ? dx : dx * this._rto,
			dy === undefined ? dy : dy * this._rto,
			dw === undefined ? dw : dw * this._rto,
			dh === undefined ? dh : dh * this._rto
		);
	}

	// tslint:disable-next-line:max-params
	private _drawImagePatchedSourceAndDest(image: CanvasImageSource, sx: number, sy: number, sw?: number, sh?: number, dx?: number, dy?: number, dw?: number, dh?: number): void {
		// if it is 'long version' of drawImage
		// see https://developer.mozilla.org/en/docs/Web/API/CanvasRenderingContext2D/drawImage
		if (dx !== undefined) {
			// then correct width and height of source image
			// IE and Edge throw InvalidStateError if value is greater than width or height
			// TODO: may be we should use first and second arguments too?
			if ('width' in image) {
				sw = Math.min(image.width as number, Math.max(1, sw as number));
			}

			if ('height' in image) {
				sh = Math.min(image.height as number, Math.max(1, sh as number));
			}
		}

		this._drawImageImpl(
			image,
			sx * this._rto,
			sy * this._rto,
			sw === undefined ? sw : sw * this._rto,
			sh === undefined ? sh : sh * this._rto,
			dx === undefined ? dx : dx * this._rto,
			dy === undefined ? dy : dy * this._rto,
			dw === undefined ? dw : dw * this._rto,
			dh === undefined ? dh : dh * this._rto
		);
	}
}
