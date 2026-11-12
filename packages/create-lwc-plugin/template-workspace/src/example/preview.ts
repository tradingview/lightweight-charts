//* The plugin catalogue frames this page next to the README, in a frame only a
//* few hundred pixels tall, so it shows the plugin at its best: no edge cases,
//* no whitespace runs, no explanatory text. The demo page next door
//* (index.html) is where all of that belongs.
//*
//* The whole layout — one compact control row above a chart that fills the rest
//* of the frame — comes from the repository's private preview kit. For a
//* control row, add
//*   import { mountControls } from '@tradingview/lwc-plugin-preview-kit/preview-controls';
//* and call `mountControls([...])` with the two or three options worth showing.
//*
//* The page follows the docs site's light/dark theme: `themeChart` restyles
//* the chart on every switch, and its callback is where to recolour anything
//* of the preview's own that would not read on the other background.
import '@tradingview/lwc-plugin-preview-kit/preview.css';
import { themeChart } from '@tradingview/lwc-plugin-preview-kit/preview-theme';
_PREVIEW_SNIPPET_
