---
id: "LocalizationOptions"
title: "Interface: LocalizationOptions"
sidebar_label: "LocalizationOptions"
sidebar_position: 0
custom_edit_url: null
---

Represents options for formattings dates, times, and prices according to a locale.

## Properties

### dateFormat

• **dateFormat**: `string`

Date formatting string.

Can contain `yyyy`, `yy`, `MMMM`, `MMM`, `MM` and `dd` literals which will be replaced with corresponding date's value.

Ignored if timeFormatter has been specified.

___

### locale

• **locale**: `string`

Current locale used to format dates. Uses the browser's language settings by default.

See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#Locale_identification_and_negotiation

___

### priceFormatter

• `Optional` **priceFormatter**: [`PriceFormatterFn`](../#priceformatterfn)

Override fomatting of the price scale crosshair label. Can be used for cases that can't be covered with built-in price formats.

See also [PriceFormatCustom](PriceFormatCustom).

___

### timeFormatter

• `Optional` **timeFormatter**: [`TimeFormatterFn`](../#timeformatterfn)

Override formatting of the time scale crosshair label.
