"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KineticAnimation = void 0;
const assertions_1 = require("../helpers/assertions");
var Constants;
(function (Constants) {
    Constants[Constants["MaxStartDelay"] = 50] = "MaxStartDelay";
    Constants[Constants["EpsilonDistance"] = 1] = "EpsilonDistance";
})(Constants || (Constants = {}));
function distanceBetweenPoints(pos1, pos2) {
    return pos1.position - pos2.position;
}
function speedPxPerMSec(pos1, pos2, maxSpeed) {
    const speed = (pos1.position - pos2.position) / (pos1.time - pos2.time);
    return Math.sign(speed) * Math.min(Math.abs(speed), maxSpeed);
}
function durationMSec(speed, dumpingCoeff) {
    const lnDumpingCoeff = Math.log(dumpingCoeff);
    return Math.log((1 /* Constants.EpsilonDistance */ * lnDumpingCoeff) / -speed) / (lnDumpingCoeff);
}
class KineticAnimation {
    constructor(minSpeed, maxSpeed, dumpingCoeff, minMove) {
        this._position1 = null;
        this._position2 = null;
        this._position3 = null;
        this._position4 = null;
        this._animationStartPosition = null;
        this._durationMsecs = 0;
        this._speedPxPerMsec = 0;
        this._minSpeed = minSpeed;
        this._maxSpeed = maxSpeed;
        this._dumpingCoeff = dumpingCoeff;
        this._minMove = minMove;
    }
    addPosition(position, time) {
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
    start(position, time) {
        if (this._position1 === null || this._position2 === null) {
            return;
        }
        if (time - this._position1.time > 50 /* Constants.MaxStartDelay */) {
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
    getPosition(time) {
        const startPosition = (0, assertions_1.ensureNotNull)(this._animationStartPosition);
        const durationMsecs = time - startPosition.time;
        return startPosition.position + this._speedPxPerMsec * (Math.pow(this._dumpingCoeff, durationMsecs) - 1) / (Math.log(this._dumpingCoeff));
    }
    finished(time) {
        return this._animationStartPosition === null || this._progressDuration(time) === this._durationMsecs;
    }
    _progressDuration(time) {
        const startPosition = (0, assertions_1.ensureNotNull)(this._animationStartPosition);
        const progress = time - startPosition.time;
        return Math.min(progress, this._durationMsecs);
    }
}
exports.KineticAnimation = KineticAnimation;
