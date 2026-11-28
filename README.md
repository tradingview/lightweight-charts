# Gold Chart — Lightweight Charts + Drawing Tools

Combined starter using the user-owned [Lightweight Charts fork](https://github.com/paman7/lightweight-charts) (v5.3.0) and the [drawing tools package](https://github.com/paman7/lightweight-charts-drawing) (v0.11.1).

## Run
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```
Deploy the generated `dist/` folder with GitHub Pages or any static host.

## Included
- Lightweight Charts candlestick chart, crosshair and time/price scale
- DrawingManager integration and grouped toolbar for the 86 drawing tools
- Selection, magnet, hide/show and clear controls
- JSON export/import and automatic browser-local drawing persistence

## Market data status
The starter currently uses generated **simulated demo candles**, not live gold prices. Replace the marked demo update adapter in `src/main.ts` with a broker or licensed market-data WebSocket/backend. Keep API secrets on the server, not in browser code.

## Attribution and license
The chart library uses Apache-2.0 and requires retaining its license and TradingView attribution. The drawing package uses MIT and its notice must also be retained. See `LICENSE` and `LICENSE.DRAWING`.
