import { ensureNotNull } from '../helpers/assertions';

import { Coordinate } from '../model/coordinate';

interface TimeAndPosition {
	time: number;
	position: Coordinate;
}

const enum Constants {
	MaxStartDelay = 50,
	EpsilonDistance = 1, // distance to the end position where we stop animation
}

function distanceBetweenPoints(pos1: TimeAndPosition, pos2: TimeAndPosition): number {
	return pos1.position - pos2.position;
}

function speedPxPerMSec(pos1: TimeAndPosition, pos2: TimeAndPosition, maxSpeed: number): number {
	const speed = (pos1.position - pos2.position) / (pos1.time - pos2.time);
	return Math.sign(speed) * Math.min(Math.abs(speed), maxSpeed);
}

function durationMSec(speed: number, dumpingCoeff: number): number {
	const lnDumpingCoeff = Math.log(dumpingCoeff);
	return Math.log((Constants.EpsilonDistance * lnDumpingCoeff) / -speed) / (lnDumpingCoeff);
}

export class KineticAnimation {
	private _position1: TimeAndPosition | null = null;
	private _position2: TimeAndPosition | null = null;
	private _position3: TimeAndPosition | null = null;
	private _position4: TimeAndPosition | null = null;

	private _animationStartPosition: TimeAndPosition | null = null;
	private _durationMsecs: number = 0;
	private _speedPxPerMsec: number = 0;

	private readonly _minMove: number;
	private readonly _minSpeed: number;
	private readonly _maxSpeed: number;
	private readonly _dumpingCoeff: number;

	public constructor(minSpeed: number, maxSpeed: number, dumpingCoeff: number, minMove: number) {
		this._minSpeed = minSpeed;
		this._maxSpeed = maxSpeed;
		this._dumpingCoeff = dumpingCoeff;
		this._minMove = minMove;
	}

	public addPosition(position: Coordinate, time: number): void {
		if (this._position1 !== null) {
			if (this._position1.time === time) {
				this._position1.position = position;
				return;
			}

			if (Math.abs(this._position1.position - position) < this._minMove) {
				return;
			}
		}

		this._position4 = this._position3;
		this._position3 = this._position2;
		this._position2 = this._position1;
		this._position1 = { time, position };
	}

	public start(position: Coordinate, time: number): void {
		if (this._position1 === null || this._position2 === null) {
			return;
		}

		if (time - this._position1.time > Constants.MaxStartDelay) {
			return;
		}

		// To calculate all the rest parameters we should calculate the speed af first
		let totalDistance = 0;

		const speed1 = speedPxPerMSec(this._position1, this._position2, this._maxSpeed);
		const distance1 = distanceBetweenPoints(this._position1, this._position2);

		// We're calculating weighted average speed
		// Than more distance for a segment, than more its weight
		const speedItems = [speed1];
		const distanceItems = [distance1];
		totalDistance += distance1;

		if (this._position3 !== null) {
			const speed2 = speedPxPerMSec(this._position2, this._position3, this._maxSpeed);
			// stop at this moment if direction of the segment is opposite
			if (Math.sign(speed2) === Math.sign(speed1)) {
				const distance2 = distanceBetweenPoints(this._position2, this._position3);

				speedItems.push(speed2);
				distanceItems.push(distance2);
				totalDistance += distance2;

				if (this._position4 !== null) {
					const speed3 = speedPxPerMSec(this._position3, this._position4, this._maxSpeed);
					if (Math.sign(speed3) === Math.sign(speed1)) {
						const distance3 = distanceBetweenPoints(this._position3, this._position4);

						speedItems.push(speed3);
						distanceItems.push(distance3);
						totalDistance += distance3;
					}
				}
			}
		}

		let resultSpeed = 0;
		for (let i = 0; i < speedItems.length; ++i) {
			resultSpeed += distanceItems[i] / totalDistance * speedItems[i];
		}

		if (Math.abs(resultSpeed) < this._minSpeed) {
			return;
		}

		this._animationStartPosition = { position, time };
		this._speedPxPerMsec = resultSpeed;
		this._durationMsecs = durationMSec(Math.abs(resultSpeed), this._dumpingCoeff);
	}

	public getPosition(time: number): Coordinate {
		const startPosition = ensureNotNull(this._animationStartPosition);
		const durationMsecs = time - startPosition.time;
		return startPosition.position + this._speedPxPerMsec * (Math.pow(this._dumpingCoeff, durationMsecs) - 1) / (Math.log(this._dumpingCoeff)) as Coordinate;
	}

	public finished(time: number): boolean {
		return this._animationStartPosition === null || this._progressDuration(time) === this._durationMsecs;
	}

	private _progressDuration(time: number): number {
		const startPosition = ensureNotNull(this._animationStartPosition);
		const progress = time - startPosition.time;
		return Math.min(progress, this._durationMsecs);
	}
}
