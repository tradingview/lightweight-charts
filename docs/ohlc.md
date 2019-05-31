# OHLC

OHLC is a type of data item. It includes the following fields:

- `time` (`Time`) - item time
- `open` (`number`) - item open price
- `high` (`number`) - item high price
- `low` (`number`) - item low price
- `close` (`number`) - item close price

This data type is used by several series types such as bars or candlesticks.

## Example

```javascript
const ohlcItem = {
    time: '2018-06-25',
    open: 10,
    high: 12,
    low: 9,
    close: 11,
};
```
