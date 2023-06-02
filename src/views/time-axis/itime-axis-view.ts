import { TimeAxisViewRenderer } from '../../renderers/time-axis-view-renderer';

export interface ITimeAxisView {
	renderer(): TimeAxisViewRenderer;
}
