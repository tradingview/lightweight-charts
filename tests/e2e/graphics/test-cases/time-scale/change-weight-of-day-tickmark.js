const brokenData = [
	{
		time: 1609286400,
		open: 605.775,
		high: 633.45,
		low: 596.55,
		close: 624.2249999999999,
	},
	{
		time: 1609804800,
		open: 606.144,
		high: 635.712,
		low: 596.288,
		close: 625.856,
	},
	{
		time: 1609977600,
		open: 606.511,
		high: 637.9780000000001,
		low: 596.0219999999999,
		close: 627.4889999999999,
	},
	{
		time: 1610150400,
		open: 606.876,
		high: 640.248,
		low: 595.752,
		close: 629.124,
	},
	{
		time: 1610841600,
		open: 607.239,
		high: 642.522,
		low: 595.478,
		close: 630.761,
	},
	{
		time: 1611360000,
		open: 620,
		high: 620,
		low: 620,
		close: 620,
	},
	{
		time: 1611792000,
		open: 620.379,
		high: 622.242,
		low: 619.758,
		close: 621.621,
	},
	{
		time: 1612310400,
		open: 620.756,
		high: 624.488,
		low: 619.512,
		close: 623.244,
	},
	{
		time: 1612483200,
		open: 621.131,
		high: 626.738,
		low: 619.262,
		close: 624.8689999999999,
	},
	{
		time: 1613174400,
		open: 621.504,
		high: 628.992,
		low: 619.008,
		close: 626.496,
	},
	{
		time: 1613260800,
		open: 621.875,
		high: 631.25,
		low: 618.75,
		close: 628.1249999999999,
	},
	{
		time: 1613952000,
		open: 622.244,
		high: 633.5120000000001,
		low: 618.4879999999999,
		close: 629.756,
	},
	{
		time: 1614729600,
		open: 622.611,
		high: 635.778,
		low: 618.222,
		close: 631.3889999999999,
	},
	{
		time: 1615334400,
		open: 622.976,
		high: 638.048,
		low: 617.952,
		close: 633.024,
	},
	{
		time: 1615939200,
		open: 623.3389999999999,
		high: 640.322,
		low: 617.678,
		close: 634.661,
	},
	{
		time: 1616025600,
		open: 623.7,
		high: 642.6,
		low: 617.4,
		close: 636.3,
	},
	{
		time: 1616630400,
		open: 624.059,
		high: 644.8820000000001,
		low: 617.1179999999999,
		close: 637.9409999999999,
	},
	{
		time: 1616889600,
		open: 624.4159999999999,
		high: 647.168,
		low: 616.832,
		close: 639.5840000000001,
	},
	{
		time: 1617148800,
		open: 624.771,
		high: 649.458,
		low: 616.542,
		close: 641.2289999999999,
	},
	{
		time: 1617840000,
		open: 625.124,
		high: 651.7520000000001,
		low: 616.2479999999999,
		close: 642.876,
	},
	{
		time: 1618272000,
		open: 625.475,
		high: 654.0500000000001,
		low: 615.9499999999999,
		close: 644.525,
	},
	{
		time: 1618963200,
		open: 625.824,
		high: 656.352,
		low: 615.648,
		close: 646.176,
	},
	{
		time: 1619049600,
		open: 626.1709999999999,
		high: 658.658,
		low: 615.342,
		close: 647.829,
	},
	{
		time: 1619568000,
		open: 626.516,
		high: 660.9680000000001,
		low: 615.0319999999999,
		close: 649.484,
	},
	{
		time: 1620345600,
		open: 626.859,
		high: 663.282,
		low: 614.718,
		close: 651.141,
	},
	{
		time: 1621123200,
		open: 640,
		high: 640,
		low: 640,
		close: 640,
	},
	{
		time: 1621296000,
		open: 640.359,
		high: 642.282,
		low: 639.718,
		close: 641.641,
	},
	{
		time: 1621555200,
		open: 640.716,
		high: 644.568,
		low: 639.432,
		close: 643.284,
	},
	{
		time: 1622332800,
		open: 641.071,
		high: 646.858,
		low: 639.142,
		close: 644.929,
	},
	{
		time: 1622851200,
		open: 641.424,
		high: 649.152,
		low: 638.848,
		close: 646.576,
	},
	{
		time: 1623024000,
		open: 641.775,
		high: 651.45,
		low: 638.55,
		close: 648.2249999999999,
	},
	{
		time: 1623369600,
		open: 642.124,
		high: 653.752,
		low: 638.248,
		close: 649.876,
	},
	{
		time: 1623628800,
		open: 642.471,
		high: 656.058,
		low: 637.942,
		close: 651.5289999999999,
	},
	{
		time: 1624320000,
		open: 642.816,
		high: 658.368,
		low: 637.632,
		close: 653.184,
	},
	{
		time: 1624492800,
		open: 643.159,
		high: 660.682,
		low: 637.318,
		close: 654.8409999999999,
	},
	{
		time: 1625270400,
		open: 643.5,
		high: 663,
		low: 637,
		close: 656.5,
	},
	{
		time: 1625443200,
		open: 643.8389999999999,
		high: 665.322,
		low: 636.678,
		close: 658.161,
	},
	{
		time: 1625616000,
		open: 644.176,
		high: 667.648,
		low: 636.352,
		close: 659.824,
	},
	{
		time: 1626048000,
		open: 644.511,
		high: 669.9780000000001,
		low: 636.0219999999999,
		close: 661.4889999999999,
	},
	{
		time: 1626825600,
		open: 644.8439999999999,
		high: 672.312,
		low: 635.688,
		close: 663.1560000000001,
	},
	{
		time: 1626912000,
		open: 645.175,
		high: 674.65,
		low: 635.35,
		close: 664.8249999999999,
	},
	{
		time: 1626998400,
		open: 645.504,
		high: 676.992,
		low: 635.008,
		close: 666.496,
	},
	{
		time: 1627344000,
		open: 645.831,
		high: 679.338,
		low: 634.662,
		close: 668.169,
	},
	{
		time: 1628121600,
		open: 646.156,
		high: 681.688,
		low: 634.312,
		close: 669.844,
	},
	{
		time: 1628467200,
		open: 646.479,
		high: 684.042,
		low: 633.958,
		close: 671.521,
	},
	{
		time: 1628553600,
		open: 660,
		high: 660,
		low: 660,
		close: 660,
	},
	{
		time: 1629244800,
		open: 660.339,
		high: 662.322,
		low: 659.678,
		close: 661.661,
	},
	{
		time: 1629849600,
		open: 660.676,
		high: 664.648,
		low: 659.352,
		close: 663.324,
	},
	{
		time: 1630195200,
		open: 661.011,
		high: 666.978,
		low: 659.022,
		close: 664.9889999999999,
	},
	{
		time: 1630627200,
		open: 661.344,
		high: 669.312,
		low: 658.688,
		close: 666.656,
	},
	{
		time: 1631059200,
		open: 661.675,
		high: 671.65,
		low: 658.35,
		close: 668.3249999999999,
	},
	{
		time: 1631750400,
		open: 662.004,
		high: 673.992,
		low: 658.008,
		close: 669.996,
	},
	{
		time: 1632355200,
		open: 662.331,
		high: 676.338,
		low: 657.662,
		close: 671.669,
	},
	{
		time: 1633046400,
		open: 662.656,
		high: 678.688,
		low: 657.312,
		close: 673.344,
	},
	{
		time: 1633392000,
		open: 662.979,
		high: 681.042,
		low: 656.958,
		close: 675.021,
	},
	{
		time: 1633564800,
		open: 663.3,
		high: 683.4,
		low: 656.6,
		close: 676.7,
	},
	{
		time: 1633737600,
		open: 663.619,
		high: 685.7620000000001,
		low: 656.2379999999999,
		close: 678.381,
	},
	{
		time: 1634169600,
		open: 663.936,
		high: 688.128,
		low: 655.872,
		close: 680.064,
	},
	{
		time: 1634601600,
		open: 664.251,
		high: 690.498,
		low: 655.502,
		close: 681.7489999999999,
	},
	{
		time: 1634860800,
		open: 664.564,
		high: 692.8720000000001,
		low: 655.1279999999999,
		close: 683.436,
	},
	{
		time: 1635292800,
		open: 664.875,
		high: 695.25,
		low: 654.75,
		close: 685.1249999999999,
	},
	{
		time: 1635984000,
		open: 665.184,
		high: 697.6320000000001,
		low: 654.3679999999999,
		close: 686.816,
	},
	{
		time: 1636070400,
		open: 665.491,
		high: 700.018,
		low: 653.982,
		close: 688.5089999999999,
	},
	{
		time: 1636243200,
		open: 665.7959999999999,
		high: 702.408,
		low: 653.592,
		close: 690.2040000000001,
	},
	{
		time: 1636934400,
		open: 666.0989999999999,
		high: 704.802,
		low: 653.198,
		close: 691.901,
	},
	{
		time: 1637280000,
		open: 680,
		high: 680,
		low: 680,
		close: 680,
	},
	{
		time: 1637366400,
		open: 680.319,
		high: 682.362,
		low: 679.638,
		close: 681.6809999999999,
	},
	{
		time: 1637625600,
		open: 680.636,
		high: 684.728,
		low: 679.272,
		close: 683.364,
	},
	{
		time: 1637712000,
		open: 680.951,
		high: 687.098,
		low: 678.902,
		close: 685.049,
	},
	{
		time: 1637798400,
		open: 681.264,
		high: 689.472,
		low: 678.528,
		close: 686.736,
	},
	{
		time: 1638403200,
		open: 681.575,
		high: 691.85,
		low: 678.15,
		close: 688.425,
	},
	{
		time: 1639008000,
		open: 681.884,
		high: 694.232,
		low: 677.768,
		close: 690.116,
	},
	{
		time: 1639094400,
		open: 682.191,
		high: 696.618,
		low: 677.382,
		close: 691.809,
	},
	{
		time: 1639785600,
		open: 682.496,
		high: 699.008,
		low: 676.992,
		close: 693.504,
	},
	{
		time: 1640131200,
		open: 682.799,
		high: 701.402,
		low: 676.598,
		close: 695.2009999999999,
	},
	{
		time: 1640390400,
		open: 683.1,
		high: 703.8000000000001,
		low: 676.1999999999999,
		close: 696.9,
	},
	{
		time: 1640649600,
		open: 683.399,
		high: 706.202,
		low: 675.798,
		close: 698.6009999999999,
	},
	{
		time: 1640908800,
		open: 683.696,
		high: 708.6080000000001,
		low: 675.3919999999999,
		close: 700.304,
	},
	{
		time: 1641600000,
		open: 683.991,
		high: 711.018,
		low: 674.982,
		close: 702.0089999999999,
	},
	{
		time: 1642204800,
		open: 684.284,
		high: 713.432,
		low: 674.568,
		close: 703.716,
	},
	{
		time: 1642464000,
		open: 684.575,
		high: 715.85,
		low: 674.15,
		close: 705.425,
	},
	{
		time: 1643068800,
		open: 684.864,
		high: 718.272,
		low: 673.728,
		close: 707.136,
	},
	{
		time: 1643328000,
		open: 685.151,
		high: 720.698,
		low: 673.302,
		close: 708.8489999999999,
	},
	{
		time: 1643414400,
		open: 685.436,
		high: 723.128,
		low: 672.872,
		close: 710.564,
	},
	{
		time: 1643500800,
		open: 685.7189999999999,
		high: 725.562,
		low: 672.438,
		close: 712.281,
	},
	{
		time: 1644019200,
		open: 700,
		high: 700,
		low: 700,
		close: 700,
	},
	{
		time: 1644105600,
		open: 700.299,
		high: 702.402,
		low: 699.598,
		close: 701.7009999999999,
	},
	{
		time: 1644364800,
		open: 700.596,
		high: 704.808,
		low: 699.192,
		close: 703.404,
	},
	{
		time: 1644883200,
		open: 700.891,
		high: 707.218,
		low: 698.782,
		close: 705.1089999999999,
	},
	{
		time: 1645142400,
		open: 701.184,
		high: 709.6320000000001,
		low: 698.3679999999999,
		close: 706.816,
	},
	{
		time: 1645574400,
		open: 701.475,
		high: 712.05,
		low: 697.95,
		close: 708.525,
	},
	{
		time: 1646092800,
		open: 701.764,
		high: 714.472,
		low: 697.528,
		close: 710.236,
	},
	{
		time: 1646870400,
		open: 702.051,
		high: 716.898,
		low: 697.102,
		close: 711.949,
	},
	{
		time: 1647561600,
		open: 702.336,
		high: 719.328,
		low: 696.672,
		close: 713.664,
	},
	{
		time: 1648166400,
		open: 702.619,
		high: 721.7620000000001,
		low: 696.2379999999999,
		close: 715.381,
	},
	{
		time: 1648771200,
		open: 702.9,
		high: 724.2,
		low: 695.8,
		close: 717.1,
	},
	{
		time: 1649376000,
		open: 703.179,
		high: 726.642,
		low: 695.358,
		close: 718.8209999999999,
	},
	{
		time: 1649462400,
		open: 703.456,
		high: 729.088,
		low: 694.912,
		close: 720.544,
	},
	{
		time: 1649721600,
		open: 703.731,
		high: 731.538,
		low: 694.462,
		close: 722.2689999999999,
	},
	{
		time: 1650067200,
		open: 704.004,
		high: 733.992,
		low: 694.008,
		close: 723.996,
	},
	{
		time: 1650758400,
		open: 704.275,
		high: 736.45,
		low: 693.55,
		close: 725.7249999999999,
	},
	{
		time: 1651190400,
		open: 704.544,
		high: 738.912,
		low: 693.088,
		close: 727.456,
	},
	{
		time: 1651708800,
		open: 704.811,
		high: 741.378,
		low: 692.622,
		close: 729.189,
	},
	{
		time: 1652486400,
		open: 705.076,
		high: 743.8480000000001,
		low: 692.1519999999999,
		close: 730.924,
	},
	{
		time: 1652918400,
		open: 705.3389999999999,
		high: 746.322,
		low: 691.678,
		close: 732.661,
	},
	{
		time: 1653177600,
		open: 720,
		high: 720,
		low: 720,
		close: 720,
	},
	{
		time: 1653264000,
		open: 720.279,
		high: 722.442,
		low: 719.558,
		close: 721.7209999999999,
	},
	{
		time: 1654041600,
		open: 720.556,
		high: 724.888,
		low: 719.112,
		close: 723.444,
	},
	{
		time: 1654560000,
		open: 720.831,
		high: 727.338,
		low: 718.662,
		close: 725.1689999999999,
	},
	{
		time: 1655078400,
		open: 721.104,
		high: 729.792,
		low: 718.208,
		close: 726.896,
	},
	{
		time: 1655856000,
		open: 721.375,
		high: 732.25,
		low: 717.75,
		close: 728.6249999999999,
	},
	{
		time: 1656115200,
		open: 721.644,
		high: 734.712,
		low: 717.288,
		close: 730.356,
	},
	{
		time: 1656633600,
		open: 721.911,
		high: 737.178,
		low: 716.822,
		close: 732.0889999999999,
	},
	{
		time: 1657324800,
		open: 722.176,
		high: 739.648,
		low: 716.352,
		close: 733.824,
	},
	{
		time: 1657670400,
		open: 722.439,
		high: 742.122,
		low: 715.878,
		close: 735.5609999999999,
	},
	{
		time: 1657843200,
		open: 722.7,
		high: 744.6,
		low: 715.4,
		close: 737.3,
	},
	{
		time: 1658620800,
		open: 722.959,
		high: 747.082,
		low: 714.918,
		close: 739.0409999999999,
	},
	{
		time: 1659139200,
		open: 723.216,
		high: 749.568,
		low: 714.432,
		close: 740.784,
	},
	{
		time: 1659398400,
		open: 723.471,
		high: 752.058,
		low: 713.942,
		close: 742.5289999999999,
	},
];
function convertTime(t) {
	if (LightweightCharts.isUTCTimestamp(t)) {
		return t * 1000;
	}
	if (LightweightCharts.isBusinessDay(t)) {
		return new Date(t.year, t.month, t.day).valueOf();
	}
	const [year, month, day] = t.split('-').map(tm => parseInt(tm, 10));
	return new Date(year, month, day).valueOf();
}

const converted = new Map();
function convertTimeWithMemory(t) {
	const existingAnswer = converted.get(t);
	if (existingAnswer) {
		return existingAnswer;
	}
	const answer = new Date(convertTime(t));
	converted.set(t, answer);
	return answer;
}
const DefaultHorzScaleBehavior	= LightweightCharts.defaultHorzScaleBehavior();
class CustomBehavior extends DefaultHorzScaleBehavior {
	constructor(...props) {
		super(...props);
		this._lastHash = '';
	}

	shouldResetTickmarkLabels(items) {
		const itemsHash = items.reduce((prev, current) => prev + current.index, '');
		const res = itemsHash !== this._lastHash;
		this._lastHash = itemsHash;
		return res;
	}
}
function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChartEx(container, new CustomBehavior(), {
		width: 800,
		height: 400,
		layout: { attributionLogo: false },
	});
	let lastDate;
	let lastTickMarkType;

	chart.timeScale().applyOptions({
		tickMarkFormatter: (time, tickMarkType) => {
			let answer = null;
			const date = convertTimeWithMemory(time);
			if (
				lastDate &&
				lastTickMarkType !== undefined &&
				date.valueOf() > lastDate.valueOf() &&
				tickMarkType > lastTickMarkType
			) {
				if (tickMarkType === LightweightCharts.TickMarkType.DayOfMonth) {
					if (
						date.getMonth() !== lastDate.getMonth() ||
						date.getFullYear() !== lastDate.getFullYear()
					) {
						answer = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
					}
				}
			}
			if (answer !== '') {
				lastDate = date;
				lastTickMarkType = tickMarkType;
			}
			return answer;
		},
	});

	const mainSeries = chart.addBarSeries();
	mainSeries.setData(brokenData);
}
