import { IAxisRenderer } from '../../renderers/iaxis-view-renderer';

export interface IAxisView {
	renderer(): IAxisRenderer | null;
}
