---
sidebar_label: Pane primitives
title: Pane primitives
sidebar_position: 2
---

**Pane primitives** are primitives attached to a chart pane rather than to a specific series.
Use pane primitives for chart-wide elements that are not tied to any series' data, such as watermarks.
The library's built-in text and image watermarks are implemented this way.
For series-bound primitives, see [Series primitives](./series-primitives.mdx).

## Attaching a primitive

A pane primitive is a class implementing the
[`IPanePrimitive`](../api/type-aliases/IPanePrimitive.md) interface.
Create an instance of your primitive and attach it to a pane with the
[`attachPrimitive`](../api/interfaces/IPaneApi.md#attachprimitive) method:

```javascript
class MyCustomPanePrimitive {
    /* Class implementing the IPanePrimitive interface */
}

// Create an instantiated pane primitive
const myCustomPanePrimitive = new MyCustomPanePrimitive();

const chart = createChart(document.getElementById('container'));
// Get the main pane
const mainPane = chart.panes()[0];

// Attach the primitive to the pane
mainPane.attachPrimitive(myCustomPanePrimitive);
```

To remove the primitive from the pane, use the
[`detachPrimitive`](../api/interfaces/IPaneApi.md#detachprimitive) method:

```javascript
mainPane.detachPrimitive(myCustomPanePrimitive);
```

## Key differences from series primitives

Pane primitives follow the same model as
[series primitives](./series-primitives.mdx) — views that return renderers,
the `attached` / `detached` lifecycle, `updateAllViews`, and hit testing —
with three differences:

- A pane primitive is attached to a pane, so
  [`paneViews`](../api/interfaces/IPanePrimitiveBase.md#paneviews) is its only
  view getter: it cannot draw on the price or time scales, or define axis
  labels.
- The `attached` method receives
  [`{ chart, requestUpdate }`](../api/interfaces/PaneAttachedParameter.md)
  without a series reference.
- There is no `autoscaleInfo`: a pane primitive is not tied to a price scale.

## Implementing a pane primitive

The `paneViews` method returns the views that draw on the pane. Each view must
provide a `renderer()` method returning the renderer that draws on the canvas:

```javascript
class MyCustomPanePrimitive {
    paneViews() {
        return [
            {
                renderer: () => ({
                    draw: target => {
                        // Custom drawing logic here
                    },
                }),
            },
        ];
    }

    // Other methods as needed...
}
```
