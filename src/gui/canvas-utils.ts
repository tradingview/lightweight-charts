import { getContext2d } from '../helpers/canvas-wrapper';

export class Size {
	public h: number;
	public w: number;

	public constructor(w: number, h: number) {
		this.w = w;
		this.h = h;
	}

	public equals(size: Size): boolean {
		return (this.w === size.w) && (this.h === size.h);
	}
}

export function resizeCanvas(canvas: HTMLCanvasElement, newSize: Size): void {
	canvas.width = newSize.w;
	canvas.height = newSize.h;

	const ctx = getContext2d(canvas);
	if (ctx) {
		ctx.translate(0.5, 0.5);
	}
}

export function clearRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, clearColor: string): void {
	ctx.save();
	ctx.translate(-0.5, -0.5);
	ctx.globalCompositeOperation = 'copy';
	ctx.fillStyle = clearColor;
	ctx.fillRect(x, y, w, h);
	ctx.restore();
}

export function addCanvasTo(element: HTMLElement, size: Size): HTMLCanvasElement {
	const canvas = document.createElement('canvas');
	element.appendChild(canvas);

	resizeCanvas(canvas, size);
	disableSelection(canvas);

	return canvas;
}

function disableSelection(canvas: HTMLCanvasElement): void {
	canvas.style.userSelect = 'none';
	canvas.style.webkitUserSelect = 'none';
	canvas.style.msUserSelect = 'none';
	// tslint:disable-next-line:no-any
	(canvas as any).style.MozUserSelect = 'none';
}
