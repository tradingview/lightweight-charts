import { Pane } from '../../model/pane';
import { IAxisRenderer } from '../../renderers/iaxis-view-renderer';

export interface IAxisView {
	renderer(pane: Pane): IAxisRenderer | null;
}
