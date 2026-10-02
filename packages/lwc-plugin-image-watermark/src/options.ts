import { PrimitivePaneViewZOrder } from 'lightweight-charts';

/** Named anchor for the watermark: the centre of the pane, or one of its corners. */
export type WatermarkAnchor =
	| 'center'
	| 'top-left'
	| 'top-right'
	| 'bottom-left'
	| 'bottom-right';

/**
 * Anchor expressed as fractions of the available area, `0` to `1`. `x: 0` puts
 * the left edge of the image against the left edge of the area, `x: 1` puts its
 * right edge against the right edge, `x: 0.5` centres it; `y` works the same way
 * top to bottom. Values outside `0`…`1` are clamped.
 */
export interface WatermarkAnchorPoint {
	x: number;
	y: number;
}

/** Where the watermark sits within the pane. */
export type WatermarkPosition = WatermarkAnchor | WatermarkAnchorPoint;

/**
 * How the image is scaled into the available area, following the CSS property
 * of the same name: `contain` scales it to fit, `cover` scales it to fill and
 * crops the overflow, `none` draws it at its natural size.
 */
export type WatermarkObjectFit = 'contain' | 'cover' | 'none';

/** `crossOrigin` attribute set on the underlying `<img>` element. */
export type ImageCrossOrigin = 'anonymous' | 'use-credentials';

export interface ImageWatermarkPluginOptions {
	/** URL of the image to draw. Also settable as the first constructor argument. */
	imageUrl?: string;
	/** Where the image sits within the pane. */
	position?: WatermarkPosition;
	/** How the image is scaled into the available area. */
	objectFit?: WatermarkObjectFit;
	/** Maximum width of the drawing area, in CSS pixels. */
	maxWidth?: number;
	/** Maximum height of the drawing area, in CSS pixels. */
	maxHeight?: number;
	/** Minimum distance between the image and the edges of the pane, in CSS pixels. */
	padding?: number;
	/** Opacity of the image, `0` to `1`. */
	alpha?: number;
	/** Whether the watermark is drawn at all. */
	visible?: boolean;
	/** Layer the watermark is drawn in. */
	zOrder?: PrimitivePaneViewZOrder;
	/** `crossOrigin` attribute of the underlying `<img>` element. */
	crossOrigin?: ImageCrossOrigin;
	/** Called when the image cannot be loaded. Nothing else reports the failure. */
	onError?: (error: unknown, imageUrl: string) => void;
}

/** @deprecated Use ImageWatermarkPluginOptions. */
export type ImageWatermarkOptions = ImageWatermarkPluginOptions;

/** The same options, with every value that has a default filled in. */
export interface ResolvedOptions extends ImageWatermarkPluginOptions {
	imageUrl: string;
	position: WatermarkPosition;
	objectFit: WatermarkObjectFit;
	maxWidth: number | undefined;
	maxHeight: number | undefined;
	padding: number;
	alpha: number;
	visible: boolean;
	zOrder: PrimitivePaneViewZOrder;
	crossOrigin: ImageCrossOrigin | undefined;
	onError: ((error: unknown, imageUrl: string) => void) | undefined;
}

const defaults: ResolvedOptions = {
	imageUrl: '',
	position: 'center',
	objectFit: 'contain',
	maxWidth: undefined,
	maxHeight: undefined,
	padding: 0,
	alpha: 1,
	visible: true,
	zOrder: 'bottom',
	crossOrigin: undefined,
	onError: undefined,
};

/** Values used for any option which is not set. */
export const defaultOptions: ImageWatermarkPluginOptions = defaults;

/**
 * Merges a partial set of options into a complete one. An option set to
 * `undefined` is left unchanged, so `applyOptions` never resets an option by
 * accident.
 */
export function mergeOptions(
	base: ResolvedOptions,
	options: ImageWatermarkPluginOptions = {}
): ResolvedOptions {
	return {
		imageUrl: options.imageUrl ?? base.imageUrl,
		position: options.position ?? base.position,
		objectFit: options.objectFit ?? base.objectFit,
		maxWidth: options.maxWidth ?? base.maxWidth,
		maxHeight: options.maxHeight ?? base.maxHeight,
		padding: options.padding ?? base.padding,
		alpha: options.alpha ?? base.alpha,
		visible: options.visible ?? base.visible,
		zOrder: options.zOrder ?? base.zOrder,
		crossOrigin: options.crossOrigin ?? base.crossOrigin,
		onError: options.onError ?? base.onError,
	};
}

/** Fills in the defaults for every option which is not set. */
export function resolveOptions(
	options?: ImageWatermarkPluginOptions
): ResolvedOptions {
	return mergeOptions(defaults, options);
}
