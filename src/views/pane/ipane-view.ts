import { Coordinate } from '../../model/coordinate';
import { Pane } from '../../model/pane';
import { IPaneRenderer } from '../../renderers/ipane-renderer';

export interface IPaneView {
	renderer(height: number, width: number, pane: Pane, addAnchors?: boolean): IPaneRenderer | null;
	clickHandler?(x: Coordinate, y: Coordinate): void;
	moveHandler?(x: Coordinate, y: Coordinate): void;
}
