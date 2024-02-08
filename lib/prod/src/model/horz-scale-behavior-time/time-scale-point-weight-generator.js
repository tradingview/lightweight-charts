function hours(count) {
    return count * 60 * 60 * 1000;
}
function minutes(count) {
    return count * 60 * 1000;
}
function seconds(count) {
    return count * 1000;
}
const intradayWeightDivisors = [
    { _internal_divisor: seconds(1), _internal_weight: 10 /* TickMarkWeight.Second */ },
    { _internal_divisor: minutes(1), _internal_weight: 20 /* TickMarkWeight.Minute1 */ },
    { _internal_divisor: minutes(5), _internal_weight: 21 /* TickMarkWeight.Minute5 */ },
    { _internal_divisor: minutes(30), _internal_weight: 22 /* TickMarkWeight.Minute30 */ },
    { _internal_divisor: hours(1), _internal_weight: 30 /* TickMarkWeight.Hour1 */ },
    { _internal_divisor: hours(3), _internal_weight: 31 /* TickMarkWeight.Hour3 */ },
    { _internal_divisor: hours(6), _internal_weight: 32 /* TickMarkWeight.Hour6 */ },
    { _internal_divisor: hours(12), _internal_weight: 33 /* TickMarkWeight.Hour12 */ },
];
function weightByTime(currentDate, prevDate) {
    if (currentDate.getUTCFullYear() !== prevDate.getUTCFullYear()) {
        return 70 /* TickMarkWeight.Year */;
    }
    else if (currentDate.getUTCMonth() !== prevDate.getUTCMonth()) {
        return 60 /* TickMarkWeight.Month */;
    }
    else if (currentDate.getUTCDate() !== prevDate.getUTCDate()) {
        return 50 /* TickMarkWeight.Day */;
    }
    for (let i = intradayWeightDivisors.length - 1; i >= 0; --i) {
        if (Math.floor(prevDate.getTime() / intradayWeightDivisors[i]._internal_divisor) !== Math.floor(currentDate.getTime() / intradayWeightDivisors[i]._internal_divisor)) {
            return intradayWeightDivisors[i]._internal_weight;
        }
    }
    return 0 /* TickMarkWeight.LessThanSecond */;
}
function cast(t) {
    return t;
}
export function fillWeightsForPoints(sortedTimePoints, startIndex = 0) {
    if (sortedTimePoints.length === 0) {
        return;
    }
    let prevTime = startIndex === 0 ? null : cast(sortedTimePoints[startIndex - 1].time)._internal_timestamp;
    let prevDate = prevTime !== null ? new Date(prevTime * 1000) : null;
    let totalTimeDiff = 0;
    for (let index = startIndex; index < sortedTimePoints.length; ++index) {
        const currentPoint = sortedTimePoints[index];
        const currentDate = new Date(cast(currentPoint.time)._internal_timestamp * 1000);
        if (prevDate !== null) {
            currentPoint.timeWeight = weightByTime(currentDate, prevDate);
        }
        totalTimeDiff += cast(currentPoint.time)._internal_timestamp - (prevTime || cast(currentPoint.time)._internal_timestamp);
        prevTime = cast(currentPoint.time)._internal_timestamp;
        prevDate = currentDate;
    }
    if (startIndex === 0 && sortedTimePoints.length > 1) {
        // let's guess a weight for the first point
        // let's say the previous point was average time back in the history
        const averageTimeDiff = Math.ceil(totalTimeDiff / (sortedTimePoints.length - 1));
        const approxPrevDate = new Date((cast(sortedTimePoints[0].time)._internal_timestamp - averageTimeDiff) * 1000);
        sortedTimePoints[0].timeWeight = weightByTime(new Date(cast(sortedTimePoints[0].time)._internal_timestamp * 1000), approxPrevDate);
    }
}
