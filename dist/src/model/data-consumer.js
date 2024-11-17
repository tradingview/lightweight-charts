export function isWhitespaceData(data) {
    return data.open === undefined && data.value === undefined;
}
export function isFulfilledData(data) {
    return isFulfilledBarData(data) || isFulfilledLineData(data);
}
export function isFulfilledBarData(data) {
    return data.open !== undefined;
}
export function isFulfilledLineData(data) {
    return data.value !== undefined;
}
