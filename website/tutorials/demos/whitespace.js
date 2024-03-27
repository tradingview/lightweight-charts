// remove-start
// Lightweight Charts™ Example: Whitespace data
// https://tradingview.github.io/lightweight-charts/tutorials/demos/whitespace

// remove-end
// hide-start
const chartOptions = {
	layout: {
		textColor: CHART_TEXT_COLOR,
		background: { type: 'solid', color: CHART_BACKGROUND_COLOR },
	},
};
// hide-end
const container = document.getElementById('container');
// remove-line
/** @type {import('lightweight-charts').IChartApi} */
const chart = createChart(container, chartOptions);

const candlestickSeries = chart.addCandlestickSeries({
	upColor: BAR_UP_COLOR,
	downColor: BAR_DOWN_COLOR,
	borderVisible: false,
	wickUpColor: BAR_UP_COLOR,
	wickDownColor: BAR_DOWN_COLOR,
});

candlestickSeries.setData([
	{
		close: 108.9974612905403,
		high: 121.20998259466148,
		low: 96.65376292551082,
		open: 104.5614412226746,
		time: { year: 2018, month: 9, day: 22 },
	},
	{
		close: 110.46815600023501,
		high: 111.3650273696516,
		low: 82.65543461471314,
		open: 110.16538466099634,
		time: { year: 2018, month: 9, day: 23 },
	},
	// highlight-start
	{
		// Whitespace data, only time is provided
		time: { year: 2018, month: 9, day: 24 },
	},
	// highlight-end
	{
		close: 96.80120024431532,
		high: 101.92074283374939,
		low: 89.25819769856513,
		open: 89.25819769856513,
		time: { year: 2018, month: 9, day: 25 },
	},
	// hide-start
	{
		close: 94.87113928076117,
		high: 104.12503365679314,
		low: 85.42405005240111,
		open: 104.12503365679314,
		time: { year: 2018, month: 9, day: 26 },
	},
	{
		close: 100.76494087674855,
		high: 102.60508417239113,
		low: 80.76268547064865,
		open: 92.93299948659636,
		time: { year: 2018, month: 9, day: 27 },
	},
	{
		close: 101.45855928883597,
		high: 110.26727325817173,
		low: 91.10348900896837,
		open: 93.4362185148034,
		time: { year: 2018, month: 9, day: 28 },
	},
	{
		close: 91.68871815146144,
		high: 103.73263644407702,
		low: 73.5329263610334,
		open: 92.96467883926464,
		time: { year: 2018, month: 9, day: 29 },
	},
	{
		time: { year: 2018, month: 9, day: 30 },
	},
	{
		time: { year: 2018, month: 10, day: 1 },
	},
	{
		close: 89.26733004009083,
		high: 89.26733004009083,
		low: 76.27851645958225,
		open: 85.83860311023625,
		time: { year: 2018, month: 10, day: 2 },
	},
	{
		close: 89.66035763006947,
		high: 89.66035763006947,
		low: 67.63677527399729,
		open: 77.79584976144585,
		time: { year: 2018, month: 10, day: 3 },
	},
	{
		close: 89.59687813884807,
		high: 97.05916949817754,
		low: 72.9823390058379,
		open: 77.37388423995716,
		time: { year: 2018, month: 10, day: 4 },
	},
	{
		close: 83.6425403120788,
		high: 91.72593377862522,
		low: 65.27208271740422,
		open: 85.92711686401718,
		time: { year: 2018, month: 10, day: 5 },
	},
	{
		close: 82.99053929200655,
		high: 93.4482645370556,
		low: 65.98920655616067,
		open: 71.8940788814462,
		time: { year: 2018, month: 10, day: 6 },
	},
	{
		time: { year: 2018, month: 10, day: 7 },
	},
	{
		time: { year: 2018, month: 10, day: 8 },
	},
	{
		close: 77.60439116240829,
		high: 83.20908153481327,
		low: 68.56836128158209,
		open: 75.83440719565763,
		time: { year: 2018, month: 10, day: 9 },
	},
	{
		close: 73.8952889203428,
		high: 81.89987377779327,
		low: 57.8891283348631,
		open: 66.51904017615065,
		time: { year: 2018, month: 10, day: 10 },
	},
	{
		close: 75.08452506029613,
		high: 75.08452506029613,
		low: 59.208194031968155,
		open: 72.14475369395771,
		time: { year: 2018, month: 10, day: 11 },
	},
	{
		close: 73.08898607472305,
		high: 73.08898607472305,
		low: 63.05632280826725,
		open: 66.93050765469924,
		time: { year: 2018, month: 10, day: 12 },
	},
	{
		close: 58.993371469509704,
		high: 73.08872095153116,
		low: 53.52204433018574,
		open: 66.12840939191403,
		time: { year: 2018, month: 10, day: 13 },
	},
	{
		time: { year: 2018, month: 10, day: 14 },
	},
	{
		time: { year: 2018, month: 10, day: 15 },
	},
	{
		close: 60.6852855399041,
		high: 69.02095441024431,
		low: 54.00939224622043,
		open: 64.81901552322648,
		time: { year: 2018, month: 10, day: 16 },
	},
	{
		close: 57.508820449565285,
		high: 63.82926565242872,
		low: 54.07370975509682,
		open: 54.07370975509682,
		time: { year: 2018, month: 10, day: 17 },
	},
	{
		close: 51.60796818909221,
		high: 64.88712939579875,
		low: 51.60796818909221,
		open: 53.489226476218434,
		time: { year: 2018, month: 10, day: 18 },
	},
	{
		close: 55.139520748382864,
		high: 59.161320710177925,
		low: 52.228139922762765,
		open: 52.228139922762765,
		time: { year: 2018, month: 10, day: 19 },
	},
	{
		close: 47.47868992247237,
		high: 58.0836625917653,
		low: 46.43213518526832,
		open: 47.59258635788406,
		time: { year: 2018, month: 10, day: 20 },
	},
	{
		time: { year: 2018, month: 10, day: 21 },
	},
	{
		time: { year: 2018, month: 10, day: 22 },
	},
	{
		close: 45.015877277800854,
		high: 51.2955426978105,
		low: 40.26534748806228,
		open: 43.90158660063875,
		time: { year: 2018, month: 10, day: 23 },
	},
	{
		close: 49.307312373439665,
		high: 49.93643636637581,
		low: 43.20705757075934,
		open: 45.672934511555795,
		time: { year: 2018, month: 10, day: 24 },
	},
	{
		close: 45.15418019295631,
		high: 48.59676744409583,
		low: 37.628047445918504,
		open: 40.33862825788268,
		time: { year: 2018, month: 10, day: 25 },
	},
	{
		close: 43.2972018283068,
		high: 43.2972018283068,
		low: 36.335943004352245,
		open: 42.605991542720965,
		time: { year: 2018, month: 10, day: 26 },
	},
	{
		close: 39.1153643552137,
		high: 44.311406627923844,
		low: 35.31457011784855,
		open: 42.00000202357808,
		time: { year: 2018, month: 10, day: 27 },
	},
	{
		time: { year: 2018, month: 10, day: 28 },
	},
	{
		time: { year: 2018, month: 10, day: 29 },
	},
	{
		close: 31.378205119641457,
		high: 37.33501102832602,
		low: 31.30137162225214,
		open: 35.651275660713694,
		time: { year: 2018, month: 10, day: 30 },
	},
	{
		close: 33.574536057730576,
		high: 37.30152570719593,
		low: 27.369689193426243,
		open: 34.330180925654936,
		time: { year: 2018, month: 10, day: 31 },
	},
	{
		close: 28.91735096504839,
		high: 32.62196350117741,
		low: 27.072564759401843,
		open: 29.398552328599372,
		time: { year: 2018, month: 11, day: 1 },
	},
	{
		close: 28.44143154172122,
		high: 31.042019861166594,
		low: 23.383320830495375,
		open: 27.275885037308072,
		time: { year: 2018, month: 11, day: 2 },
	},
	{
		close: 25.92162714418916,
		high: 30.57604443170622,
		low: 25.418671641150752,
		open: 26.775196275924657,
		time: { year: 2018, month: 11, day: 3 },
	},
	{
		time: { year: 2018, month: 11, day: 4 },
	},
	{
		time: { year: 2018, month: 11, day: 5 },
	},
	{
		close: 31.103861067101136,
		high: 31.103861067101136,
		low: 24.39227668420513,
		open: 28.994785427089838,
		time: { year: 2018, month: 11, day: 6 },
	},
	{
		close: 28.6308138310307,
		high: 35.430817482769164,
		low: 24.069515410358232,
		open: 27.109407394069084,
		time: { year: 2018, month: 11, day: 7 },
	},
	{
		close: 29.468889521733466,
		high: 37.54082586961352,
		low: 27.90833873315644,
		open: 33.16901271715577,
		time: { year: 2018, month: 11, day: 8 },
	},
	{
		close: 35.887823124204296,
		high: 39.21804237580939,
		low: 30.951078044055627,
		open: 30.951078044055627,
		time: { year: 2018, month: 11, day: 9 },
	},
	{
		close: 34.361137347097575,
		high: 35.27083445807796,
		low: 27.825889562160082,
		open: 34.86040182980157,
		time: { year: 2018, month: 11, day: 10 },
	},
	{
		time: { year: 2018, month: 11, day: 11 },
	},
	{
		time: { year: 2018, month: 11, day: 12 },
	},
	{
		close: 40.15038854039306,
		high: 41.50912000191902,
		low: 32.610637769394444,
		open: 41.50912000191902,
		time: { year: 2018, month: 11, day: 13 },
	},
	{
		close: 44.092601065208015,
		high: 44.092601065208015,
		low: 37.778306506100726,
		open: 38.99045898154136,
		time: { year: 2018, month: 11, day: 14 },
	},
	{
		close: 41.42426637839382,
		high: 44.72189614841937,
		low: 41.42426637839382,
		open: 44.72189614841937,
		time: { year: 2018, month: 11, day: 15 },
	},
	{
		close: 41.19513795258408,
		high: 49.08084695291049,
		low: 36.24282165100056,
		open: 44.909248500660254,
		time: { year: 2018, month: 11, day: 16 },
	},
	{
		close: 44.24935708161703,
		high: 53.028535501565486,
		low: 40.32056743060158,
		open: 46.198546801109984,
		time: { year: 2018, month: 11, day: 17 },
	},
	{
		time: { year: 2018, month: 11, day: 18 },
	},
	{
		time: { year: 2018, month: 11, day: 19 },
	},
	{
		close: 48.79128595974164,
		high: 52.45087789296739,
		low: 46.80633073487828,
		open: 52.45087789296739,
		time: { year: 2018, month: 11, day: 20 },
	},
	{
		close: 46.97300046781947,
		high: 55.80689868049132,
		low: 46.97300046781947,
		open: 55.80689868049132,
		time: { year: 2018, month: 11, day: 21 },
	},
	{
		close: 55.58129861112469,
		high: 55.58129861112469,
		low: 49.087279242343996,
		open: 53.16719476594961,
		time: { year: 2018, month: 11, day: 22 },
	},
	{
		close: 50.058979311730226,
		high: 62.55333249171461,
		low: 50.058979311730226,
		open: 52.628489607588826,
		time: { year: 2018, month: 11, day: 23 },
	},
	{
		close: 51.193155229085995,
		high: 59.08949991997865,
		low: 51.193155229085995,
		open: 55.352594157474755,
		time: { year: 2018, month: 11, day: 24 },
	},
	{
		time: { year: 2018, month: 11, day: 25 },
	},
	{
		time: { year: 2018, month: 11, day: 26 },
	},
	{
		close: 57.875350873413225,
		high: 65.59903214448208,
		low: 57.875350873413225,
		open: 62.747405667247016,
		time: { year: 2018, month: 11, day: 27 },
	},
	{
		close: 61.231150731698605,
		high: 66.3829902228434,
		low: 61.231150731698605,
		open: 65.01028486919516,
		time: { year: 2018, month: 11, day: 28 },
	},
	{
		close: 64.9698540874806,
		high: 77.09783903299783,
		low: 58.455031795628194,
		open: 58.455031795628194,
		time: { year: 2018, month: 11, day: 29 },
	},
	{
		close: 72.40978471883417,
		high: 72.40978471883417,
		low: 53.05804901549206,
		open: 65.907298021202,
		time: { year: 2018, month: 11, day: 30 },
	},
	{
		close: 74.60745731538934,
		high: 78.33742117000789,
		low: 54.42067144918077,
		open: 73.20930147914103,
		time: { year: 2018, month: 12, day: 1 },
	},
	{
		time: { year: 2018, month: 12, day: 2 },
	},
	{
		time: { year: 2018, month: 12, day: 3 },
	},
	{
		close: 68.23682161095334,
		high: 77.6723729460968,
		low: 68.23682161095334,
		open: 74.39471534484744,
		time: { year: 2018, month: 12, day: 4 },
	},
	{
		close: 67.45035792565862,
		high: 83.53728553118547,
		low: 67.45035792565862,
		open: 74.79418570077237,
		time: { year: 2018, month: 12, day: 5 },
	},
	{
		close: 79.26722967320323,
		high: 79.26722967320323,
		low: 68.40654829383521,
		open: 68.40654829383521,
		time: { year: 2018, month: 12, day: 6 },
	},
	{
		close: 74.95305464030587,
		high: 81.65884414224071,
		low: 64.08761481290135,
		open: 81.65884414224071,
		time: { year: 2018, month: 12, day: 7 },
	},
	{
		close: 86.30802154315482,
		high: 91.21953112925642,
		low: 65.46112304993535,
		open: 77.82514647663533,
		time: { year: 2018, month: 12, day: 8 },
	},
	{
		time: { year: 2018, month: 12, day: 9 },
	},
	{
		time: { year: 2018, month: 12, day: 10 },
	},
	{
		close: 79.00109311074502,
		high: 88.74271558831151,
		low: 69.00900811612337,
		open: 88.74271558831151,
		time: { year: 2018, month: 12, day: 11 },
	},
	{
		close: 80.98779620162513,
		high: 97.07429720104427,
		low: 73.76970378608283,
		open: 88.57288529720472,
		time: { year: 2018, month: 12, day: 12 },
	},
	{
		close: 87.83619759370346,
		high: 91.29759438607132,
		low: 74.00740214639268,
		open: 87.51853658661781,
		time: { year: 2018, month: 12, day: 13 },
	},
	{
		close: 87.50134898892377,
		high: 102.95635188637507,
		low: 81.0513723219724,
		open: 94.74009794290814,
		time: { year: 2018, month: 12, day: 14 },
	},
	{
		close: 92.40159548029843,
		high: 103.24363067710844,
		low: 75.44605394394573,
		open: 95.99903495559444,
		time: { year: 2018, month: 12, day: 15 },
	},
	{
		time: { year: 2018, month: 12, day: 16 },
	},
	{
		time: { year: 2018, month: 12, day: 17 },
	},
	{
		close: 96.04408990868804,
		high: 101.02158248010466,
		low: 94.38544669520195,
		open: 101.02158248010466,
		time: { year: 2018, month: 12, day: 18 },
	},
	{
		close: 97.2120815653703,
		high: 103.35830035963959,
		low: 78.72594316029567,
		open: 86.98009038330306,
		time: { year: 2018, month: 12, day: 19 },
	},
	{
		close: 105.23366706522204,
		high: 106.56174456393981,
		low: 94.6658899187065,
		open: 106.56174456393981,
		time: { year: 2018, month: 12, day: 20 },
	},
	{
		close: 89.53750874231946,
		high: 112.27917367188074,
		low: 87.13586952228918,
		open: 96.0857985693989,
		time: { year: 2018, month: 12, day: 21 },
	},
	{
		close: 88.55787263435407,
		high: 112.62138454627025,
		low: 80.42783344898223,
		open: 88.34340019789849,
		time: { year: 2018, month: 12, day: 22 },
	},
	{
		time: { year: 2018, month: 12, day: 23 },
	},
	{
		time: { year: 2018, month: 12, day: 24 },
	},
	{
		close: 93.38124264891343,
		high: 93.38124264891343,
		low: 84.5674956907938,
		open: 87.54923273867136,
		time: { year: 2018, month: 12, day: 25 },
	},
	{
		close: 87.88725775527871,
		high: 90.14253631595105,
		low: 77.28638555494503,
		open: 83.93199044032968,
		time: { year: 2018, month: 12, day: 26 },
	},
	{
		close: 71.77940077333062,
		high: 89.25710176370582,
		low: 67.74278646676306,
		open: 78.5346198695072,
		time: { year: 2018, month: 12, day: 27 },
	},
	{
		close: 72.08757207606054,
		high: 79.36518615067514,
		low: 69.18787486704672,
		open: 69.18787486704672,
		time: { year: 2018, month: 12, day: 28 },
	},
	{
		close: 73.87977927793119,
		high: 77.62891475860795,
		low: 70.42293039125319,
		open: 70.42293039125319,
		time: { year: 2018, month: 12, day: 29 },
	},
	{
		time: { year: 2018, month: 12, day: 30 },
	},
	{
		close: 71.00787215611817,
		high: 71.00787215611817,
		low: 57.29681995441558,
		open: 60.04464694823929,
		time: { year: 2018, month: 12, day: 31 },
	},
	// hide-end
]);

chart.timeScale().fitContent();
