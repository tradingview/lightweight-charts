import { TimeAxisViewRenderer } from '../../renderers/time-axis-view-renderer';

export interface ITimeAxisView<HorzScaleItem> {
	renderer(): TimeAxisViewRenderer<HorzScaleItem>;
}
