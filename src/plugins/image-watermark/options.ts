export interface ImageWatermarkOptions {
	/**
	 * Maximum width for the image watermark.
	 *
	 * @defaultValue undefined
	 */
	maxWidth?: number;
	/**
	 * Maximum height for the image watermark.
	 *
	 * @defaultValue undefined
	 */
	maxHeight?: number;
	/**
	 * Padding to maintain around the image watermark relative
	 * to the chart pane edges.
	 *
	 * @defaultValue 0
	 */
	padding: number;
	/**
	 * The alpha (opacity) for the image watermark. Where `1` is fully
	 * opaque (visible) and `0` is fully transparent.
	 *
	 * @defaultValue 1
	 */
	alpha: number;
}

export const imageWatermarkOptionsDefaults: ImageWatermarkOptions = {
	alpha: 1,
	padding: 0,
};
