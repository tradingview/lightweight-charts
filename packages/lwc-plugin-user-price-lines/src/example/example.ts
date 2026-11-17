import { LineSeries, createChart } from 'lightweight-charts';
import { UserPriceLines } from '../user-price-lines';
import { lineData } from './sample-data';

const chart = createChart('chart', { autoSize: true });

const series = chart.addSeries(LineSeries, { color: '#2962FF' });
series.setData(lineData(200));
chart.timeScale().fitContent();

// Move the pointer to the right edge of the pane: a button follows it, and a
// click on the button adds a price line there.
const lines = new UserPriceLines({ lineColor: '#F23645' });
series.attachPrimitive(lines);

const maxLines = document.getElementById('max-lines') as HTMLSelectElement;
const crosshair = document.getElementById('crosshair') as HTMLInputElement;
const remove = document.getElementById('remove') as HTMLButtonElement;
const status = document.getElementById('status') as HTMLSpanElement;

function showLines(): void {
	status.textContent = `Lines: ${lines.lines().map(line => line.options().price.toFixed(2)).join(', ') || 'none'}`;
}

lines.lineAdded().subscribe(showLines);
lines.lineRemoved().subscribe(showLines);
maxLines.addEventListener('change', () => lines.applyOptions({ maxLines: Number(maxLines.value) }));
crosshair.addEventListener('change', () => lines.applyOptions({ setCrosshairMode: crosshair.checked }));
remove.addEventListener('click', () => lines.removeAll());
showLines();
