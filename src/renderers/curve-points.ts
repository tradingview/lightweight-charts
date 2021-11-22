/**
 *  For Draw smooth curves through points,
 *  used https://github.com/gdenisov/cardinal-spline-js
 *  see curve_func.js section
 *
 */
export function curve(ctx: CanvasRenderingContext2D, points: number[], mTension?: number, mNumOfSeg?: number, mClose?: boolean): Float32Array {
	if (points.length < 2) {
		return new Float32Array(0);
	}

	// options or defaults
	const tension: number = typeof mTension === 'number' ? mTension : 0.5;
	const numOfSeg: number = typeof mNumOfSeg === 'number' ? mNumOfSeg : 25;

	let pts: number[]; // for cloning point array

	let l = points.length;
	let rPos = 0;
	const rLen = (l - 2) * numOfSeg + 2 + (mClose ? 2 * numOfSeg : 0);
	const res = new Float32Array(rLen);
	const cache = new Float32Array((numOfSeg + 2) << 2);
	let cachePtr = 4;

	pts = points.slice(0);

	if (mClose) {
		pts.unshift(points[l - 1]);										// insert end point as first point
		pts.unshift(points[l - 2]);
		pts.push(points[0], points[1]); 								// first point as last point
	} else {
		pts.unshift(points[1]);											// copy 1. point and insert at beginning
		pts.unshift(points[0]);
		pts.push(points[l - 2], points[l - 1]);							// duplicate end-points
	}

	// cache inner-loop calculations as they are based on t alone
	cache[0] = 1;														// 1,0,0,0

	for (let i = 1; i < numOfSeg; i++) {
		const st = i / numOfSeg;
		const st2 = st * st;
		const st3 = st2 * st;
		const st23 = st3 * 2;
		const st32 = st2 * 3;

		cache[cachePtr++] = st23 - st32 + 1;							// c1
		cache[cachePtr++] = st32 - st23;								// c2
		cache[cachePtr++] = st3 - 2 * st2 + st;							// c3
		cache[cachePtr++] = st3 - st2;									// c4
	}

	cache[++cachePtr] = 1;												// 0,1,0,0

	// calc. points
	parse(pts, cache, l);

	if (mClose) {
		pts = [];
		pts.push(points[l - 4], points[l - 3], points[l - 2], points[l - 1], points[0], points[1], points[2], points[3]);
		parse(pts, cache, 4);
	}

	function parse(mPts: number[], mCache: Float32Array, mLength: number): void {
		for (let i = 2, t; i < mLength; i += 2) {
			const pt1 = mPts[i];
			const pt2 = mPts[i + 1];
			const pt3 = mPts[i + 2];
			const pt4 = mPts[i + 3];

			const t1x = (pt3 - mPts[i - 2]) * tension;
			const t1y = (pt4 - mPts[i - 1]) * tension;
			const t2x = (mPts[i + 4] - pt1) * tension;
			const t2y = (mPts[i + 5] - pt2) * tension;
			let c = 0;
			let c1;
			let c2;
			let c3;
			let c4;

			for (t = 0; t < numOfSeg; t++) {
				c1 = mCache[c++];
				c2 = mCache[c++];
				c3 = mCache[c++];
				c4 = mCache[c++];

				res[rPos++] = c1 * pt1 + c2 * pt3 + c3 * t1x + c4 * t2x;
				res[rPos++] = c1 * pt2 + c2 * pt4 + c3 * t1y + c4 * t2y;
			}
		}
	}

	// add last point
	l = mClose ? 0 : points.length - 2;
	res[rPos++] = points[l++];
	res[rPos] = points[l];

	// add lines to path
	for (let i = 0, j = res.length; i < j; i += 2) {
		ctx.lineTo(res[i], res[i + 1]);
	}

	return res;
}
