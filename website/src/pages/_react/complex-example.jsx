import { createChart } from 'lightweight-charts';
import React, {
	createContext,
	forwardRef,
	useCallback,
	useContext,
	useImperativeHandle,
	useLayoutEffect,
	useRef,
	useState,
} from 'react';

const Context = createContext();

export const App = () => {
	const series1 = useRef(null);

	return (
		<Chart width={600} height={400}>
			<Series
				ref={series1}
				type={'line'}
				data={[
					{ time: '2018-10-11', value: 52.89 },
					{ time: '2018-10-12', value: 51.65 },
					{ time: '2018-10-13', value: 51.56 },
					{ time: '2018-10-14', value: 50.19 },
					{ time: '2018-10-15', value: 51.86 },
					{ time: '2018-10-16', value: 51.25 },
				]}
			/>
		</Chart>
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
	const context = useRef({
		api() {
			if (!this._api) {
				// eslint-disable-next-line no-unused-vars
				const { children, container, ...rest } = props;
				this._api = createChart(container, rest);
				this._api.timeScale().fitContent();
			}
			return this._api;
		},
		free() {
			if (this._api) {
				this._api.remove();
			}
		},
	});

	useLayoutEffect(() => {
		const currentRef = context.current;
		currentRef.api();
	}, []);

	useLayoutEffect(() => {
		const currentRef = context.current;

		// eslint-disable-next-line no-unused-vars
		const { children, container, ...rest } = props;
		currentRef.api().applyOptions(rest);
	}, [props]);

	useImperativeHandle(ref, () => context.current.api(), []);

	return (
		<Context.Provider value={context.current}>
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
				// eslint-disable-next-line no-unused-vars
				const { children, data, type, ...rest } = props;
				this._api = type === 'line' ? parent.api().addLineSeries(rest) : parent.api().addAreaSeries(rest);
				this._api.setData(data);
			}
			return this._api;
		},
		free() {
			if (this._api) {
				parent.free();
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
		// eslint-disable-next-line no-unused-vars
		const { chilren, data, ...rest } = props;
		currentRef.api().applyOptions(rest);
	}, [props]);

	useImperativeHandle(ref, () => context.current.api(), []);

	return (
		<Context.Provider value={context.current}>
			{props.children}
		</Context.Provider>
	);
});
Series.displayName = 'Series';
