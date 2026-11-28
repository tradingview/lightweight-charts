import "./style.css";
import { CandlestickSeries, createChart, type Time } from "lightweight-charts";
import { DrawingManager } from "lightweight-charts-drawing";
import { initializeToolbar } from "./toolbar";

const chartEl = document.getElementById("chart");
if (!chartEl) throw new Error("Missing #chart element");
const chart = createChart(chartEl, {
  autoSize: true,
  layout: { background: { color: "#0b0e13" }, textColor: "#c8d0dc", fontFamily: "Inter, system-ui, sans-serif" },
  grid: { vertLines: { color: "#171d27" }, horzLines: { color: "#171d27" } },
  rightPriceScale: { borderColor: "#283140" },
  timeScale: { borderColor: "#283140", rightOffset: 10, timeVisible: true },
  crosshair: { vertLine: { color: "#8b95a7", labelBackgroundColor: "#343e50" }, horzLine: { color: "#8b95a7", labelBackgroundColor: "#343e50" } },
});
const series = chart.addSeries(CandlestickSeries, {
  upColor: "#16a085", downColor: "#e04f5f", borderVisible: false,
  wickUpColor: "#16a085", wickDownColor: "#e04f5f",
});
const now = Math.floor(Date.now() / 60) * 60;
const demoBars = Array.from({ length: 500 }, (_, i) => {
  const time = (now - (500 - i) * 60) as Time;
  const base = 2650 + Math.sin(i / 18) * 16 + Math.sin(i / 6) * 3.5 + i * 0.018;
  const open = base + Math.sin(i * 1.4) * 0.9;
  const close = base + Math.sin(i * 1.4 + 0.7) * 1.2;
  return { time, open, high: Math.max(open, close) + 0.85, low: Math.min(open, close) - 0.85, close };
});
series.setData(demoBars);
chart.timeScale().setVisibleLogicalRange({ from: 350, to: 510 });
const drawings = new DrawingManager(chart, series, { magnet: "weak", touchHitTolerance: 18 });
const STORE = "gold-chart-drawing-v1";
try { drawings.importJSON(localStorage.getItem(STORE) ?? "[]"); } catch { /* ignore invalid saved drawings */ }
drawings.on("change", () => localStorage.setItem(STORE, drawings.exportJSON()));
initializeToolbar(drawings);
const price = document.getElementById("last-price");
const showPrice = (value: number) => { if (price) price.textContent = value.toFixed(2); };
showPrice(demoBars.at(-1)!.close);

document.getElementById("save")?.addEventListener("click", () => {
  const blob = new Blob([drawings.exportJSON()], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "gold-drawings.json"; a.click();
  URL.revokeObjectURL(url);
});
document.getElementById("load")?.addEventListener("click", () => document.getElementById("import-file")?.click());
document.getElementById("import-file")?.addEventListener("change", async (event) => {
  const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return;
  try { drawings.importJSON(await file.text()); } catch (error) { alert("Invalid drawing file: " + (error as Error).message); }
});
document.getElementById("clear")?.addEventListener("click", () => { if (confirm("Delete all drawings?")) drawings.clear(); });

// SIMULATED DEMO TICKS ONLY. This is not a live XAUUSD feed.
// For live data, replace this timer with your broker/provider WebSocket adapter
// and call series.update({ time, open, high, low, close }) per incoming candle.
setInterval(() => {
  const last = demoBars.at(-1)!;
  const close = last.close + (Math.random() - 0.49) * 0.35;
  const bar = { ...last, close, high: Math.max(last.high, close), low: Math.min(last.low, close) };
  demoBars[demoBars.length - 1] = bar;
  series.update(bar);
  showPrice(close);
}, 1500);
window.addEventListener("beforeunload", () => { drawings.destroy(); chart.remove(); });
