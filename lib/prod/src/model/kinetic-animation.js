import { ensureNotNull } from '../helpers/assertions';
;
function distanceBetweenPoints(pos1, pos2) {
    return pos1._internal_position - pos2._internal_position;
}
function speedPxPerMSec(pos1, pos2, maxSpeed) {
    const speed = (pos1._internal_position - pos2._internal_position) / (pos1._internal_time - pos2._internal_time);
    return Math.sign(speed) * Math.min(Math.abs(speed), maxSpeed);
}
function durationMSec(speed, dumpingCoeff) {
    const lnDumpingCoeff = Math.log(dumpingCoeff);
    return Math.log((1 /* Constants.EpsilonDistance */ * lnDumpingCoeff) / -speed) / (lnDumpingCoeff);
}
export class KineticAnimation {
    constructor(minSpeed, maxSpeed, dumpingCoeff, minMove) {
        this._private__position1 = null;
        this._private__position2 = null;
        this._private__position3 = null;
        this._private__position4 = null;
        this._private__animationStartPosition = null;
        this._private__durationMsecs = 0;
        this._private__speedPxPerMsec = 0;
        this._private__minSpeed = minSpeed;
        this._private__maxSpeed = maxSpeed;
        this._private__dumpingCoeff = dumpingCoeff;
        this._private__minMove = minMove;
    }
    _internal_addPosition(position, time) {
        if (this._private__position1 !== null) {
            if (this._private__position1._internal_time === time) {
                this._private__position1._internal_position = position;
                return;
            }
            if (Math.abs(this._private__position1._internal_position - position) < this._private__minMove) {
                return;
            }
        }
        this._private__position4 = this._private__position3;
        this._private__position3 = this._private__position2;
        this._private__position2 = this._private__position1;
        this._private__position1 = { _internal_time: time, _internal_position: position };
    }
    _internal_start(position, time) {
        if (this._private__position1 === null || this._private__position2 === null) {
            return;
        }
        if (time - this._private__position1._internal_time > 50 /* Constants.MaxStartDelay */) {
            return;
        }
        // To calculate all the rest parameters we should calculate the speed af first
        let totalDistance = 0;
        const speed1 = speedPxPerMSec(this._private__position1, this._private__position2, this._private__maxSpeed);
        const distance1 = distanceBetweenPoints(this._private__position1, this._private__position2);
        // We're calculating weighted average speed
        // Than more distance for a segment, than more its weight
        const speedItems = [speed1];
        const distanceItems = [distance1];
        totalDistance += distance1;
        if (this._private__position3 !== null) {
            const speed2 = speedPxPerMSec(this._private__position2, this._private__position3, this._private__maxSpeed);
            // stop at this moment if direction of the segment is opposite
            if (Math.sign(speed2) === Math.sign(speed1)) {
                const distance2 = distanceBetweenPoints(this._private__position2, this._private__position3);
                speedItems.push(speed2);
                distanceItems.push(distance2);
                totalDistance += distance2;
                if (this._private__position4 !== null) {
                    const speed3 = speedPxPerMSec(this._private__position3, this._private__position4, this._private__maxSpeed);
                    if (Math.sign(speed3) === Math.sign(speed1)) {
                        const distance3 = distanceBetweenPoints(this._private__position3, this._private__position4);
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
        if (Math.abs(resultSpeed) < this._private__minSpeed) {
            return;
        }
        this._private__animationStartPosition = { _internal_position: position, _internal_time: time };
        this._private__speedPxPerMsec = resultSpeed;
        this._private__durationMsecs = durationMSec(Math.abs(resultSpeed), this._private__dumpingCoeff);
    }
    _internal_getPosition(time) {
        const startPosition = ensureNotNull(this._private__animationStartPosition);
        const durationMsecs = time - startPosition._internal_time;
        return startPosition._internal_position + this._private__speedPxPerMsec * (Math.pow(this._private__dumpingCoeff, durationMsecs) - 1) / (Math.log(this._private__dumpingCoeff));
    }
    _internal_finished(time) {
        return this._private__animationStartPosition === null || this._private__progressDuration(time) === this._private__durationMsecs;
    }
    _private__progressDuration(time) {
        const startPosition = ensureNotNull(this._private__animationStartPosition);
        const progress = time - startPosition._internal_time;
        return Math.min(progress, this._private__durationMsecs);
    }
}
