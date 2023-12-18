class ChartManager {
  constructor() {
    this.chart = null;
    this.xspan = null;
    this.klines = null;
    this.candleseries = null;
    this.domElement = document.getElementById("tvchart");
    this.initializeChart();
    this.loadData();
  }

  initializeChart() {
    const chartProperties = {
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
      },
      crosshair: {
        mode: LightweightCharts.CrosshairMode.Normal,
      },
    };
    this.chart = LightweightCharts.createChart(
      this.domElement,
      chartProperties
    );
    this.candleseries = this.chart.addCandlestickSeries();
  }

  async loadData() {
    try {
      const response = await fetch("./data.json");
      const data = await response.json();

      // 首先按 time 屬性對數據進行升序排序
      const sortedData = data.data.sort((a, b) => (new Date(a.time)).getTime() - (new Date(b.time)).getTime());

      this.klines = sortedData.map((item) => ({
        time: Math.floor(new Date(item.time).getTime() / 1000),
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
      }));

      // 假定 klines 現在是按時間升序的，計算 xspan
      this.xspan = sortedData
        .map((item) => Math.floor(new Date(item.time).getTime() / 1000))
        .reduce((acc, cur, i, arr) => i > 0 ? Math.min(acc, cur - arr[i - 1]) : acc, Infinity);

      const prebars = [...new Array(100)].map((_, i, index) => ({
        time: this.klines[0].time - (100 - i) * this.xspan
      }));

      const postbars = [...new Array(100)].map((_, i) => ({
        time: this.klines[this.klines.length - 1].time + (i + 1) * this.xspan
      }));

      this.candleseries.setData([...prebars, ...this.klines, ...postbars]);

      this.drawTrendLine();

    } catch (error) {
      console.error("Error fetching or parsing data:", error);
    }
  }

  drawTrendLine() {
    if (!this.chart || !this.domElement || !this.klines || !this.xspan || !this.candleseries) {
      console.log('klines: ', this.klines);
      console.log('xspan: ', this.xspan);
      console.log('candleseries: ', this.candleseries);
      return;
    }
    this.chart.initTrendLineDrawingController(
      this.chart,
      this.domElement,
      this.klines,
      this.xspan,
      this.candleseries,
    );
  }
}

const manager = new ChartManager();