import { IPaneRenderer } from '../../renderers/ipane-renderer';

export interface IPaneView {
	renderer(height: number, width: number, addAnchors?: boolean): IPaneRenderer | null;
}
