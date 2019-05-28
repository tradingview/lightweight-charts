import { Coordinate } from '../../model/coordinate';
import { IPaneRenderer } from '../../renderers/ipane-renderer';

export type MouseHandler = (x: Coordinate, y: Coordinate) => void;

export interface IPaneView {
	renderer(height: number, width: number, addAnchors?: boolean): IPaneRenderer | null;
	clickHandler?(x: Coordinate, y: Coordinate): void;
	moveHandler?(x: Coordinate, y: Coordinate): void;
}
