var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
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
