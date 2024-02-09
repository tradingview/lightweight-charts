import { Coordinate } from '../model/coordinate';
export declare class KineticAnimation {
    private _position1;
    private _position2;
    private _position3;
    private _position4;
    private _animationStartPosition;
    private _durationMsecs;
    private _speedPxPerMsec;
    private readonly _minMove;
    private readonly _minSpeed;
    private readonly _maxSpeed;
    private readonly _dumpingCoeff;
    constructor(minSpeed: number, maxSpeed: number, dumpingCoeff: number, minMove: number);
    addPosition(position: Coordinate, time: number): void;
    start(position: Coordinate, time: number): void;
    getPosition(time: number): Coordinate;
    finished(time: number): boolean;
    private _progressDuration;
}
