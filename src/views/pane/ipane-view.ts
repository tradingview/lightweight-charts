import { IPaneRenderer } from '../../renderers/ipane-renderer';

export interface IPaneView<HorzScaleItem> {
	renderer(addAnchors?: boolean): IPaneRenderer | null;
}
