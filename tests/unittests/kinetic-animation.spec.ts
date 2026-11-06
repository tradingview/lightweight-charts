/* eslint-disable @typescript-eslint/no-floating-promises */
import { expect } from 'chai';
import { describe, it } from 'node:test';

import { Coordinate } from '../../src/model/coordinate';
import { KineticAnimation } from '../../src/model/kinetic-animation';

function startedAnimation(startTime: number): KineticAnimation {
	const animation = new KineticAnimation(0.01, 10, 0.997, 0.5);
	animation.addPosition(0 as Coordinate, 0);
	animation.addPosition(5 as Coordinate, 10);
	animation.addPosition(10 as Coordinate, 20);
	animation.start(10 as Coordinate, startTime);
	return animation;
}

describe('KineticAnimation', () => {
	it('is finished when it has not been started', () => {
		const animation = new KineticAnimation(0.01, 10, 0.997, 0.5);
		expect(animation.finished(0)).to.be.equal(true);
	});

	it('finishes only after its duration has passed', () => {
		const startTime = 25;
		const animation = startedAnimation(startTime);

		expect(animation.finished(startTime)).to.be.equal(false);

		let duration = 0;
		while (!animation.finished(startTime + duration)) {
			duration++;
		}

		expect(duration).to.be.greaterThan(1);
		expect(animation.finished(startTime + duration + 1000)).to.be.equal(true);
	});

	it('does not move past its end position when a frame arrives long after the end', () => {
		const startTime = 25;
		const animation = startedAnimation(startTime);

		let duration = 0;
		while (!animation.finished(startTime + duration)) {
			duration++;
		}

		const endPosition = animation.getPosition(startTime + duration);
		expect(animation.getPosition(startTime + duration + 1)).to.be.equal(endPosition);
		expect(animation.getPosition(startTime + duration + 100000)).to.be.equal(endPosition);
	});

	it('stays at its start position for frames timestamped before the start', () => {
		const startTime = 25;
		const animation = startedAnimation(startTime);

		expect(animation.finished(startTime - 1)).to.be.equal(false);
		expect(animation.getPosition(startTime - 1)).to.be.equal(10);
		expect(animation.getPosition(startTime - 100)).to.be.equal(10);
	});

	it('is finished right away when it is too slow to travel the minimal distance', () => {
		const animation = new KineticAnimation(0.0001, 10, 0.997, 0);
		animation.addPosition(0 as Coordinate, 0);
		animation.addPosition(0.01 as Coordinate, 10);
		animation.start(0.01 as Coordinate, 10);

		expect(animation.finished(10)).to.be.equal(true);
		expect(animation.finished(9)).to.be.equal(true);
	});

	it('moves in the direction of the gesture', () => {
		const startTime = 25;
		const animation = startedAnimation(startTime);

		expect(animation.getPosition(startTime)).to.be.equal(10);
		expect(animation.getPosition(startTime + 100)).to.be.greaterThan(10);
	});
});
