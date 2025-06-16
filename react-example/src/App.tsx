import { useEffect, useRef, useState } from 'react';
import {
  createChart,
  type IChartApi,
  type CandlestickData,
  type LineData,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  BaselineSeries,
  BarSeries,
  HistogramSeries,
} from 'lightweight-charts';

const API_URL = import.meta.env.VITE_API_URL ?? 'https://chart-widget-backend-production.up.railway.app/api';
const CHART_ID = '1766151d-f972-42ac-bbb6-d31579f80dc2';

export default function App() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<any>(null);
  const candleDataRef = useRef<CandlestickData[]>([]);
  const lineDataRef = useRef<LineData[]>([]);
  const [seriesType, setSeriesType] = useState<'Candlestick' | 'Bar' | 'Line' | 'Area' | 'Baseline' | 'Histogram'>('Candlestick');

  useEffect(() => {
    if (!chartContainerRef.current) return;
    const chart = createChart(chartContainerRef.current, { height: chartContainerRef.current.clientHeight });
    chartRef.current = chart;
    const series = chart.addSeries(CandlestickSeries);
    seriesRef.current = series;

    async function loadData() {
      const chartResp = await fetch(`${API_URL}/charts/${CHART_ID}`);
      if (!chartResp.ok) {
        console.error('Failed to load chart info');
        return;
      }
      const chartInfo = await chartResp.json();
      const symbol = chartInfo.symbol;

      const now = Math.floor(Date.now() / 1000);
      const from = now - 60 * 60 * 24 * 30; // 30 days
      const resp = await fetch(`${API_URL}/charts/data/${symbol}?from=${from}&to=${now}&interval=1h`);
      if (!resp.ok) {
        console.error('Failed to load data');
        return;
      }
      const data = await resp.json() as {time:number, open:number, high:number, low:number, close:number, volume:number}[];
      const transformed: CandlestickData[] = data.map(d => ({
        time: d.time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close
      }));
      candleDataRef.current = transformed;
      lineDataRef.current = transformed.map(d => ({ time: d.time, value: d.close }));
      series.setData(transformed);
    }
    loadData();
    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current!.clientWidth, height: chartContainerRef.current!.clientHeight });
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;
    if (!seriesRef.current) return;
    const chart = chartRef.current;
    chart.removeSeries(seriesRef.current);
    const definitionMap = {
      Candlestick: CandlestickSeries,
      Bar: BarSeries,
      Line: LineSeries,
      Area: AreaSeries,
      Baseline: BaselineSeries,
      Histogram: HistogramSeries,
    } as const;
    const newSeries = chart.addSeries(definitionMap[seriesType]);
    seriesRef.current = newSeries;
    if (seriesType === 'Candlestick' || seriesType === 'Bar') {
      newSeries.setData(candleDataRef.current);
    } else {
      newSeries.setData(lineDataRef.current);
    }
  }, [seriesType]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
      <select
        value={seriesType}
        onChange={(e) => setSeriesType(e.target.value as any)}
        style={{ position: 'absolute', top: 10, right: 10 }}
      >
        <option value="Candlestick">Candlestick</option>
        <option value="Bar">Bar</option>
        <option value="Line">Line</option>
        <option value="Area">Area</option>
        <option value="Baseline">Baseline</option>
        <option value="Histogram">Histogram</option>
      </select>
    </div>
  );
}
