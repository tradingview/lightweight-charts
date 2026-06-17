import { BitmapShapeItemCoordinates, shapeSize } from './utils';

export function drawTriangle(
	up: boolean,
	ctx: CanvasRenderingContext2D,
	coords: BitmapShapeItemCoordinates,
	size: number
): void {
	const triangleSize = shapeSize('triangleUp', size);
	const halfTriangleSize = ((triangleSize - 1) / 2) * coords.pixelRatio;

	ctx.beginPath();

	if (up) {
		// Vẽ tam giác hướng lên
		ctx.moveTo(coords.x, coords.y - halfTriangleSize); // Đỉnh tam giác hướng lên
		ctx.lineTo(coords.x - halfTriangleSize, coords.y + halfTriangleSize); // Góc trái
		ctx.lineTo(coords.x + halfTriangleSize, coords.y + halfTriangleSize); // Góc phải
	} else {
		// Vẽ tam giác hướng xuống
		ctx.moveTo(coords.x, coords.y + halfTriangleSize); // Đỉnh tam giác hướng xuống
		ctx.lineTo(coords.x - halfTriangleSize, coords.y - halfTriangleSize); // Góc trái
		ctx.lineTo(coords.x + halfTriangleSize, coords.y - halfTriangleSize); // Góc phải
	}

	ctx.closePath(); // Kết thúc tam giác

	ctx.fill();
}


export function hitTestTriangle(
	up: boolean,
	centerX: number,
	centerY: number,
	size: number,
	x: number,
	y: number
): boolean {
	const halfSize = size / 2;

	// Định nghĩa 3 đỉnh của tam giác dựa trên hướng
	let ax, ay, bx, by, cx, cy;
	if (up) {
		ax = centerX;
		ay = centerY - halfSize;

		bx = centerX - halfSize;
		by = centerY + halfSize;

		cx = centerX + halfSize;
		cy = centerY + halfSize;
	} else {
		ax = centerX;
		ay = centerY + halfSize;

		bx = centerX - halfSize;
		by = centerY - halfSize;

		cx = centerX + halfSize;
		cy = centerY - halfSize;
	}

	// Dùng công thức barycentric để kiểm tra điểm có nằm trong tam giác không
	const area = (bx - ax) * (cy - ay) - (cx - ax) * (by - ay);
	const s = ((ay - cy) * (x - cx) + (cx - ax) * (y - cy)) / area;
	const t = ((cy - by) * (x - cx) + (bx - cx) * (y - cy)) / area;
	const u = 1 - s - t;

	return s >= 0 && t >= 0 && u >= 0;
}
