---
id: "PriceFormatBuiltIn"
title: "Interface: PriceFormatBuiltIn"
sidebar_label: "PriceFormatBuiltIn"
sidebar_position: 0
custom_edit_url: null
---

Represents series value formatting options.
The precision and minMove properties allow wide customization of formatting.

**`example`**
minMove = 0.01 , precision is not specified. Prices will change like 1.13, 1.14, 1.15 etc.
minMove = 0.01 , precision = 3. Prices will change like 1.130, 1.140, 1.150 etc.
minMove = 0.05 , precision is not specified. Prices will change like 1.10, 1.15, 1.20

## Properties

### minMove

• **minMove**: `number`

Minimal step of the price. This value shouldn't have more decimal digits than the precision.

___

### precision

• **precision**: `number`

Number of digits after the decimal point.
If it is not set, then its value is calculated automatically based on minMove.

___

### type

• **type**: ``"price"`` \| ``"volume"`` \| ``"percent"``

Built-in price formats.
'price' is the most common choice; it allows customization of precision and rounding of prices.
'volume' uses abbreviation for formatting prices like '1.2K' or '12.67M'.
'percent' uses '%' sign at the end of prices.
