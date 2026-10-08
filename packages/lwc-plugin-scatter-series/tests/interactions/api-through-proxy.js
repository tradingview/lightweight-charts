// The series API works when the host keeps it behind a Proxy: a plain one, and
// one that behaves like a Vue `reactive()`/`ref()` (functions bound to the
// proxy, object values wrapped in proxies of their own). Every member is
// called through the proxies; `series()` still returns the underlying series
// itself, and `remove()` releases the chart for the next scatter series.
async function beforeInteractions(container) {
	const frames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	const proxies = new WeakMap();
	const reactive = target => {
		if (typeof target !== 'object' || target === null) {
			return target;
		}
		if (!proxies.has(target)) {
			proxies.set(target, new Proxy(target, {
				get(object, key, receiver) {
					const value = Reflect.get(object, key, receiver);
					return typeof value === 'function' ? value.bind(receiver) : reactive(value);
				},
				set: (object, key, value, receiver) => Reflect.set(object, key, value, receiver),
			}));
		}
		return proxies.get(target);
	};
	const check = (condition, message) => {
		if (!condition) { throw new Error(message); }
	};

	const chart = LwcPlugin.createScatterChart(container, { layout: { attributionLogo: false } });
	const api = LwcPlugin.createScatterSeries(chart, { opacity: 1, pointSize: 20 });
	const plain = new Proxy(api, {});
	const series = reactive(api);

	series.setData([
		{ id: 'a', x: 0, y: 0, group: 'g', sizeValue: 1 },
		{ id: 'b', x: 5, y: 5, group: 'g', sizeValue: 2 },
		{ id: 'c', x: 10, y: 10, group: 'h', sizeValue: 3 },
	]);
	check(plain.data().length === 3, `data() through a proxy: ${plain.data().length} points`);
	series.applyOptions({ color: '#F23645', hoveredSizeIncrease: 4 });
	plain.applyOptions({ hitTestTolerance: 0 });
	check(series.options().color === '#F23645' && plain.options().hitTestTolerance === 0, 'applyOptions() through a proxy changed nothing');
	check(series.groups().map(group => group.id).join() === 'g,h', `groups() through a proxy: ${JSON.stringify(series.groups())}`);
	series.setGroupVisible('h', false);
	check(plain.groups()[1].visible === false, 'setGroupVisible() through a proxy did not hide the group');
	plain.setGroupVisible('h', true);
	check(series.sizeMapping()?.sizeFor(2) > 0, 'sizeMapping() through a proxy');
	check(series.series() === api.series() && plain.series() === api.series(), 'series() through a proxy is not the underlying series');
	await frames();

	const a = series.pointById('a');
	check(a !== null && plain.pointById('c') !== null, 'pointById() through a proxy found no point');
	check(series.hitTest(a.x, a.y)?.objectId === 'a', 'hitTest() through a proxy');
	const domain = plain.xDomain();
	check(domain.min <= 0 && domain.max >= 10, `xDomain() through a proxy: ${JSON.stringify(domain)}`);
	series.fitXDomain();
	const x = series.xToCoordinate(5);
	check(x !== null && Math.abs(plain.coordinateToX(x) - 5) < 1e-6, `xToCoordinate()/coordinateToX() through a proxy: ${x}`);

	const notes = [];
	const handler = info => notes.push(info === null ? null : info.objectId);
	series.subscribeHoveredPointChange(handler);
	plain.setHoveredPoint('b');
	await frames();
	check(series.hoveredPoint()?.objectId === 'b' && plain.hoveredPoint()?.objectId === 'b', 'setHoveredPoint()/hoveredPoint() through a proxy');
	check(JSON.stringify(notes) === '["b"]', `The handler subscribed through a proxy was not notified: ${JSON.stringify(notes)}`);
	plain.unsubscribeHoveredPointChange(handler);
	series.setHoveredPoint(null);
	await frames();
	check(JSON.stringify(notes) === '["b"]', `The handler unsubscribed through a proxy was notified: ${JSON.stringify(notes)}`);

	series.remove();
	plain.remove();
	check(chart.panes()[0].getSeries().length === 0, 'remove() through a proxy left the series on the chart');
	// The chart is released: it takes another scatter series.
	const next = LwcPlugin.createScatterSeries(chart);
	next.setData([{ x: 1, y: 1 }]);
	await frames();
	check(next.pointById('0') !== null, 'A scatter series added after remove() through a proxy draws nothing');
}
