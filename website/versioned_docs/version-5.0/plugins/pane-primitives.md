---
sidebar_label: Pane Primitives
sidebar_position: 2
---

# Pane Primitives

In addition to Series Primitives, the library now supports Pane Primitives. These are essentially the same as Series Primitives but are designed to draw on the pane of a chart rather than being associated with a specific series. Pane Primitives can be used for features like watermarks or other chart-wide annotations.

## Key Differences from Series Primitives

1. Pane Primitives are attached to the chart pane rather than a specific series.
2. They cannot draw on the price and time scales.
3. They are ideal for chart-wide features that are not tied to a particular series.

## Adding a Pane Primitive

Pane Primitives can be added to a chart using the `attachPrimitive` method on the [`IPaneApi`](../api/interfaces/IPaneApi.md) interface. Here's an example:

```javascript
const chart = createChart(document.getElementById('container'));
const pane = chart.panes()[0]; // Get the first (main) pane

const myPanePrimitive = new MyCustomPanePrimitive();
pane.attachPrimitive(myPanePrimitive);
```

## Implementing a Pane Primitive

To create a Pane Primitive, you should implement the [`IPanePrimitive`](../api/type-aliases/IPanePrimitive.md) interface. This interface is similar to [`ISeriesPrimitive`](../api/type-aliases/ISeriesPrimitive.md), but with some key differences:

- It doesn't include methods for drawing on price and time scales.
- The `paneViews` method is used to define what will be drawn on the chart pane.

Here's a basic example of a Pane Primitive implementation:

```javascript
class MyCustomPanePrimitive {
    paneViews() {
        return [
            {
                renderer: {
                    draw: target => {
                        // Custom drawing logic here
                    },
                },
            },
        ];
    }

    // Other methods as needed...
}
```

For more details on implementing Pane Primitives, refer to the [`IPanePrimitive`](../api/type-aliases/IPanePrimitive.md) interface documentation.
