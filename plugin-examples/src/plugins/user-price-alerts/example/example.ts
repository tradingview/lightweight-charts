import { LineStyle, createChart } from 'lightweight-charts';
import { generateLineData } from '../../../sample-data';
import { UserAlertInfo } from '../state';
import { UserPriceAlerts } from '../user-price-alerts';

const chartContainer = document.querySelector<HTMLDivElement>('#chart');
if (!chartContainer) throw new Error('Chart Container Missing!');
const chart = createChart('chart', {
	autoSize: true,
	grid: {
		vertLines: {
			visible: false,
		},
		horzLines: {
			visible: false,
		},
	},
	timeScale: {
		borderVisible: false,
	},
	rightPriceScale: {
		borderVisible: false,
	},
	crosshair: {
		horzLine: {
			visible: false,
			labelVisible: false,
		},
		vertLine: {
			labelVisible: false,
			style: LineStyle.Solid,
			width: 1,
		},
	},
	handleScale: false,
	handleScroll: false,
});

const areaSeries = chart.addAreaSeries({
	lineColor: 'rgb(4,153,129)',
	topColor: 'rgba(4,153,129, 0.4)',
	bottomColor: 'rgba(4,153,129, 0)',
	priceLineVisible: false,
});
const data = generateLineData();
areaSeries.setData(data);

const userPriceAlertsPrimitive = new UserPriceAlerts();
userPriceAlertsPrimitive.setSymbolName('AAPL');
areaSeries.attachPrimitive(userPriceAlertsPrimitive);

chart.timeScale().fitContent();

userPriceAlertsPrimitive.alertAdded().subscribe((alertInfo: UserAlertInfo) => {
	console.log(
		`➕ Alert added @ ${alertInfo.price} with the id: ${alertInfo.id}`
	);
});

userPriceAlertsPrimitive.alertRemoved().subscribe((id: string) => {
	console.log(`❌ Alert removed with the id: ${id}`);
});
