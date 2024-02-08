import { __rest } from "tslib";
export function convertSeriesMarker(sm, newTime, originalTime) {
    const { time: inTime, originalTime: inOriginalTime } = sm, values = __rest(sm, ["time", "originalTime"]);
    /* eslint-disable @typescript-eslint/consistent-type-assertions */
    const res = Object.assign({ time: newTime }, values);
    /* eslint-enable @typescript-eslint/consistent-type-assertions */
    if (originalTime !== undefined) {
        res.originalTime = originalTime;
    }
    return res;
}
