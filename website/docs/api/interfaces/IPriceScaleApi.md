---
id: "IPriceScaleApi"
title: "Interface: IPriceScaleApi"
sidebar_label: "IPriceScaleApi"
sidebar_position: 0
custom_edit_url: null
---

Interface to control chart's price scale

## Methods

### applyOptions

▸ **applyOptions**(`options`): `void`

Applies new options to the price scale

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `options` | [`DeepPartial`](../#deeppartial)<[`PriceScaleOptions`](PriceScaleOptions)\> | any subset of PriceScaleOptions |

#### Returns

`void`

___

### options

▸ **options**(): `Readonly`<[`PriceScaleOptions`](PriceScaleOptions)\>

Returns currently applied options of the price scale

#### Returns

`Readonly`<[`PriceScaleOptions`](PriceScaleOptions)\>

full set of currently applied options, including defaults

___

### width

▸ **width**(): `number`

Returns a width of the price scale if it's visible or 0 if invisible.

#### Returns

`number`
