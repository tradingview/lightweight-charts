// delete-start
/* Note: this file shouldn't be used directly because it has some constants which are set by
the docusaurus site to ensure that the chart looks great in both dark and light color themes.
If you want to use this example then please copy the code presented on the documentation site.
[link](https://tradingview.github.io/lightweight-charts/tutorials/react/advanced) */
// delete-end
import { createChart } from 'lightweight-charts';
import React, {
	createContext,
	forwardRef,
	useCallback,
	useContext,
	useEffect,
	useImperativeHandle,
	useLayoutEffect,
	useRef,
	useState,
} from 'react';

const Context = createContext();

const initialData = [
	{ time: '2018-10-11', value: 52.89 },
	{ time: '2018-10-12', value: 51.65 },
	{ time: '2018-10-13', value: 51.56 },
	{ time: '2018-10-14', value: 50.19 },
	{ time: '2018-10-15', value: 51.86 },
	{ time: '2018-10-16', value: 51.25 },
];

const initialData2 = [
	{ time: '2018-10-11', value: 42.89 },
	{ time: '2018-10-12', value: 41.65 },
	{ time: '2018-10-13', value: 41.56 },
	{ time: '2018-10-14', value: 40.19 },
	{ time: '2018-10-15', value: 41.86 },
	{ time: '2018-10-16', value: 41.25 },
];
const currentDate = new Date(initialData[initialData.length - 1].time);

export const App = props => {
	const {
		colors: {
			backgroundColor = CHART_BACKGROUND_COLOR,
			lineColor = LINE_LINE_COLOR,
			textColor = CHART_TEXT_COLOR,
		} = {},
	} = props;

	const [chartLayoutOptions, setChartLayoutOptions] = useState({});
	// The following variables illustrate how a series could be updated.
	const series1 = useRef(null);
	const series2 = useRef(null);
	const [started, setStarted] = useState(false);
	const [isSecondSeriesActive, setIsSecondSeriesActive] = useState(false);

	// The purpose of this effect is purely to show how a series could
	// be updated using the `reference` passed to the `Series` component.
	useEffect(() => {
		if (series1.current === null) {
			return;
		}
		let intervalId;

		if (started) {
			intervalId = setInterval(() => {
				currentDate.setDate(currentDate.getDate() + 1);
				const next = {
					time: currentDate.toISOString().slice(0, 10),
					value: 53 - 2 * Math.random(),
				};
				series1.current.update(next);
				if (series2.current) {
					series2.current.update({
						...next,
						value: 43 - 2 * Math.random(),
					});
				}
			}, 1000);
		}
		return () => clearInterval(intervalId);
	}, [started]);

	useEffect(() => {
		setChartLayoutOptions({
			background: {
				color: backgroundColor,
			},
			textColor,
		});
	}, [backgroundColor, textColor]);

	return (
		<>
			<button type="button" onClick={() => setStarted(current => !current)}>
				{started ? 'Stop updating' : 'Start updating series'}
			</button>
			<button type="button" onClick={() => setIsSecondSeriesActive(current => !current)}>
				{isSecondSeriesActive ? 'Remove second series' : 'Add second series'}
			</button>
			<Chart layout={chartLayoutOptions}>
				<Series
					ref={series1}
					type={'line'}
					data={initialData}
					color={lineColor}
				/>
				{isSecondSeriesActive && <Series
					ref={series2}
					type={'area'}
					data={initialData2}
					color={lineColor}
				/>}
			</Chart>
		</>
	);
};

export function Chart(props) {
	const [container, setContainer] = useState(false);
	const handleRef = useCallback(ref => setContainer(ref), []);
	return (
		<div ref={handleRef}>
			{container && <ChartContainer {...props} container={container} />}
		</div>
	);
}

export const ChartContainer = forwardRef((props, ref) => {
	const { children, container, layout, ...rest } = props;

	const chartApiRef = useRef({
		isRemoved: false,
		api() {
			if (!this._api) {
				this._api = createChart(container, {
					...rest,
					layout,
					width: container.clientWidth,
					height: 300,
				});
				this._api.timeScale().fitContent();
			}
			return this._api;
		},
		free(series) {
			if (this._api && series) {
				this._api.removeSeries(series);
			}
		},
	});

	useLayoutEffect(() => {
		const currentRef = chartApiRef.current;
		const chart = currentRef.api();

		const handleResize = () => {
			chart.applyOptions({
				...rest,
				width: container.clientWidth,
			});
		};

		window.addEventListener('resize', handleResize);
		return () => {
			window.removeEventListener('resize', handleResize);
			chartApiRef.current.isRemoved = true;
			chart.remove();
		};
	}, []);

	useLayoutEffect(() => {
		const currentRef = chartApiRef.current;
		currentRef.api();
	}, []);

	useLayoutEffect(() => {
		const currentRef = chartApiRef.current;
		currentRef.api().applyOptions(rest);
	}, []);

	useImperativeHandle(ref, () => chartApiRef.current.api(), []);

	useEffect(() => {
		const currentRef = chartApiRef.current;
		currentRef.api().applyOptions({ layout });
	}, [layout]);

	return (
		<Context.Provider value={chartApiRef.current}>
			{props.children}
		</Context.Provider>
	);
});
ChartContainer.displayName = 'ChartContainer';

export const Series = forwardRef((props, ref) => {
	const parent = useContext(Context);
	const context = useRef({
		api() {
			if (!this._api) {
				const { children, data, type, ...rest } = props;
				this._api =
					type === 'line'
						? parent.api().addLineSeries(rest)
						: parent.api().addAreaSeries(rest);
				this._api.setData(data);
			}
			return this._api;
		},
		free() {
			// check if parent component was removed already
			if (this._api && !parent.isRemoved) {
				// remove only current series
				parent.free(this._api);
			}
		},
	});

	useLayoutEffect(() => {
		const currentRef = context.current;
		currentRef.api();

		return () => currentRef.free();
	}, []);

	useLayoutEffect(() => {
		const currentRef = context.current;
		const { children, data, ...rest } = props;
		currentRef.api().applyOptions(rest);
	});

	useImperativeHandle(ref, () => context.current.api(), []);

	return (
		<Context.Provider value={context.current}>
			{props.children}
		</Context.Provider>
	);
});
Series.displayName = 'Series';
