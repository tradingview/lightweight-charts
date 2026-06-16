import { Time, Coordinate } from 'lightweight-charts';

export interface Point {
	time: Time; 
	price: number;
}

export interface ViewPoint {
	x: Coordinate | null;
	y: Coordinate | null;
}
