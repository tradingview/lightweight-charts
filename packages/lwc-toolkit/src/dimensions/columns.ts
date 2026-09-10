const alignToMinimalWidthLimit = 4;
const showSpacingMinimalBarWidth = 1;

/**
 * Spacing gap between columns.
 * @param barSpacingMedia - spacing between bars (media coordinate)
 * @param horizontalPixelRatio - horizontal pixel ratio
 * @returns Spacing gap between columns (in Bitmap coordinates)
 */
function columnSpacing(barSpacingMedia: number, horizontalPixelRatio: number) {
	return Math.ceil(barSpacingMedia * horizontalPixelRatio) <=
		showSpacingMinimalBarWidth
		? 0
		: Math.max(1, Math.floor(horizontalPixelRatio));
}

/**
 * Desired width for columns. This may not be the final width because
 * it may be adjusted later to ensure all columns on screen have a
 * consistent width and gap.
 * @param barSpacingMedia - spacing between bars (media coordinate)
 * @param horizontalPixelRatio - horizontal pixel ratio
 * @param spacing - Spacing gap between columns (in Bitmap coordinates). (optional, provide if you have already calculated it)
 * @returns Desired width for column bars (in Bitmap coordinates)
 */
function desiredColumnWidth(
	barSpacingMedia: number,
	horizontalPixelRatio: number,
	spacing?: number
) {
	return (
		Math.round(barSpacingMedia * horizontalPixelRatio) -
		(spacing ?? columnSpacing(barSpacingMedia, horizontalPixelRatio))
	);
}

interface ColumnCommon {
	/** Spacing gap between columns */
	spacing: number;
	/** Shift columns left by one pixel */
	shiftLeft: boolean;
	/** Half width of a column */
	columnHalfWidthBitmap: number;
	/** horizontal pixel ratio */
	horizontalPixelRatio: number;
}

/**
 * Calculated values which are common to all the columns on the screen, and
 * are required to calculate the individual positions.
 * @param barSpacingMedia - spacing between bars (media coordinate)
 * @param horizontalPixelRatio - horizontal pixel ratio
 * @returns calculated values for subsequent column calculations
 */
function columnCommon(
	barSpacingMedia: number,
	horizontalPixelRatio: number
): ColumnCommon {
	const spacing = columnSpacing(barSpacingMedia, horizontalPixelRatio);
	const columnWidthBitmap = desiredColumnWidth(
		barSpacingMedia,
		horizontalPixelRatio,
		spacing
	);
	const shiftLeft = columnWidthBitmap % 2 === 0;
	const columnHalfWidthBitmap = (columnWidthBitmap - (shiftLeft ? 0 : 1)) / 2;
	return {
		spacing,
		shiftLeft,
		columnHalfWidthBitmap,
		horizontalPixelRatio,
	};
}

export interface ColumnPosition {
	left: number;
	right: number;
	shiftLeft: boolean;
}

/**
 * Calculate the position for a column. These values can be later adjusted
 * by a second pass which corrects widths, and shifts columns.
 * @param xMedia - column x position (center) in media coordinates
 * @param columnData - precalculated common values (returned by `columnCommon`)
 * @param previousPosition - result from this function for the previous bar.
 * @returns initial column position
 */
function calculateColumnPosition(
	xMedia: number,
	columnData: ColumnCommon,
	previousPosition: ColumnPosition | undefined
): ColumnPosition {
	const xBitmapUnRounded = xMedia * columnData.horizontalPixelRatio;
	const xBitmap = Math.round(xBitmapUnRounded);
	const xPositions: ColumnPosition = {
		left: xBitmap - columnData.columnHalfWidthBitmap,
		right:
			xBitmap +
			columnData.columnHalfWidthBitmap -
			(columnData.shiftLeft ? 1 : 0),
		shiftLeft: xBitmap > xBitmapUnRounded,
	};
	const expectedAlignmentShift = columnData.spacing + 1;
	if (previousPosition) {
		if (xPositions.left - previousPosition.right !== expectedAlignmentShift) {
			// need to adjust alignment
			if (previousPosition.shiftLeft) {
				previousPosition.right = xPositions.left - expectedAlignmentShift;
			} else {
				xPositions.left = previousPosition.right + expectedAlignmentShift;
			}
		}
	}
	return xPositions;
}

function fixPositionsAndReturnSmallestWidth(
	positions: ColumnPosition[],
	initialMinWidth: number
): number {
	return positions.reduce((smallest: number, position: ColumnPosition) => {
		if (position.right < position.left) {
			position.right = position.left;
		}
		const width = position.right - position.left + 1;
		return Math.min(smallest, width);
	}, initialMinWidth);
}

function fixAlignmentForNarrowColumns(
	positions: ColumnPosition[],
	minColumnWidth: number
) {
	return positions.map((position: ColumnPosition) => {
		const width = position.right - position.left + 1;
		if (width <= minColumnWidth) return position;
		if (position.shiftLeft) {
			position.right -= 1;
		} else {
			position.left += 1;
		}
		return position;
	});
}

/**
 * Calculates the column positions and widths for the x positions.
 * This function creates a new array. You may get faster performance using the
 * `calculateColumnPositionsInPlace` function instead
 * @param xMediaPositions - x positions for the bars in media coordinates
 * @param barSpacingMedia - spacing between bars in media coordinates
 * @param horizontalPixelRatio - horizontal pixel ratio
 * @returns Positions for the columns
 */
export function calculateColumnPositions(
	xMediaPositions: number[],
	barSpacingMedia: number,
	horizontalPixelRatio: number
): ColumnPosition[] {
	const common = columnCommon(barSpacingMedia, horizontalPixelRatio);
	const positions = new Array<ColumnPosition>(xMediaPositions.length);
	let previous: ColumnPosition | undefined = undefined;
	for (let i = 0; i < xMediaPositions.length; i++) {
		positions[i] = calculateColumnPosition(
			xMediaPositions[i],
			common,
			previous
		);
		previous = positions[i];
	}
	const initialMinWidth = Math.ceil(barSpacingMedia * horizontalPixelRatio);
	const minColumnWidth = fixPositionsAndReturnSmallestWidth(
		positions,
		initialMinWidth
	);
	if (common.spacing > 0 && minColumnWidth < alignToMinimalWidthLimit) {
		return fixAlignmentForNarrowColumns(positions, minColumnWidth);
	}
	return positions;
}

export interface ColumnPositionItem {
	x: number;
	/**
	 * Logical index of the bar (as provided by the library on each bar item).
	 * When present, it is used to detect gaps in the data: two columns are only
	 * aligned against each other when they are consecutive (`time` differs by
	 * exactly one). Leave it undefined if the items are known to be gapless.
	 */
	time?: number;
	column?: ColumnPosition;
}

/**
 * Whether two neighbouring items are adjacent bars, and therefore whether the
 * second one should have its edge aligned against the first. Items without a
 * `time` are assumed to be adjacent, which keeps callers that do not populate
 * `time` behaving exactly as before.
 */
function isAdjacentBar(
	current: ColumnPositionItem,
	previous: ColumnPositionItem
): boolean {
	if (current.time === undefined || previous.time === undefined) return true;
	return current.time === previous.time + 1;
}

/**
 * Calculates the column positions and widths for bars using the existing the
 * array of items.
 *
 * Columns are only aligned against their neighbour when the two bars are
 * consecutive, so the first column after a whitespace gap is neither widened
 * nor shifted. This requires the items to carry a `time` (logical index); when
 * they do not, every item is treated as adjacent to the previous one.
 *
 * @param items - bar items which include an `x` property (and optionally a `time` property), and will be mutated to contain a column property
 * @param barSpacingMedia - bar spacing in media coordinates
 * @param horizontalPixelRatio - horizontal pixel ratio
 * @param startIndex - start index for visible bars within the items array (inclusive)
 * @param endIndex - end index for visible bars within the items array (exclusive)
 */
export function calculateColumnPositionsInPlace(
	items: ColumnPositionItem[],
	barSpacingMedia: number,
	horizontalPixelRatio: number,
	startIndex: number,
	endIndex: number
): void {
	const common = columnCommon(barSpacingMedia, horizontalPixelRatio);
	const lastIndex = Math.min(endIndex, items.length);
	let previous: ColumnPosition | undefined = undefined;
	for (let i = startIndex; i < lastIndex; i++) {
		const alignAgainst =
			previous !== undefined && isAdjacentBar(items[i], items[i - 1])
				? previous
				: undefined;
		items[i].column = calculateColumnPosition(items[i].x, common, alignAgainst);
		previous = items[i].column;
	}
	let minColumnWidth = Math.ceil(barSpacingMedia * horizontalPixelRatio);
	for (let i = startIndex; i < lastIndex; i++) {
		const column = items[i].column;
		if (!column) continue;
		if (column.right < column.left) {
			column.right = column.left;
		}
		minColumnWidth = Math.min(minColumnWidth, column.right - column.left + 1);
	}
	if (common.spacing > 0 && minColumnWidth < alignToMinimalWidthLimit) {
		for (let i = startIndex; i < lastIndex; i++) {
			const column = items[i].column;
			if (!column) continue;
			const width = column.right - column.left + 1;
			if (width <= minColumnWidth) continue;
			if (column.shiftLeft) {
				column.right -= 1;
			} else {
				column.left += 1;
			}
		}
	}
}
