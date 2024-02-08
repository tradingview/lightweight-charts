export function isWhitespaceData(data) {
    return data.open === undefined && data.value === undefined;
}
export function isFulfilledData(data) {
    return (data.open !== undefined ||
        data.value !== undefined);
}
