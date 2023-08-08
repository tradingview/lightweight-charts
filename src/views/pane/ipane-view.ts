import { CustomPriceLine } from '../../model/custom-price-line';
import { IPaneRenderer } from '../../renderers/ipane-renderer';

export interface IPaneView {
	renderer(addAnchors?: boolean): IPaneRenderer | null;
	priceLine?: CustomPriceLine;
}
