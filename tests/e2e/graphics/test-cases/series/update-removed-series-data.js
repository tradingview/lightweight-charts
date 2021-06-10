function generateData() {
  var res = [];
  var time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
  for (var i = 0; i < 3; ++i) {
    res.push({
      time: time.getTime() / 1000,
      value: i * Math.random(),
    });

    time.setUTCDate(time.getUTCDate() + 1);
  }

  return res;
}

function runTestCase(container) {
  const chart = LightweightCharts.createChart(container, {
    width: 600,
    height: 300,
    timeScale: {
      barSpacing: 40,
      timeVisible: true,
    }
  });

  const data1 = generateData()
  const data2 = generateData()
  const series1 = chart.addLineSeries({ title: 'Series 1' })
  const series2 = chart.addLineSeries({ title: 'Series 2' })

  return new Promise((resolve) => {
    setTimeout(() => {
      series1.setData(data1);

      setTimeout(() => {
        series2.setData(data2);

        setTimeout(() => {
          series1.setData([]);

          setTimeout(() => {
            series2.setData([]);

            setTimeout(() => {
              series1.setData(data1);

              resolve()
            }, 50)
          }, 50)
        }, 50)
      }, 50)
    }, 50)
  })
}
