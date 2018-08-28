export default {
  title: {
    textStyle: {
      align: 'center',
      color: '#aaa'
    }
  },
  tooltip: {},
  visualMap: {
    max: 20,
    textStyle: {
      color: '#aaa'
    },
    inRange: {
      color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
    }
  },
  xAxis3D: {
    type: 'category',
    name: '时间'
  },
  yAxis3D: {
    type: 'category',
    name: '时长'
  },
  zAxis3D: {
    type: 'value',
    name: '数量',
    minInterval: 1
  },
  grid3D: {
    boxWidth: 240,
    boxDepth: 200,
    axisLine: {
      lineStyle: {
        color: '#aaa'
      }
    },
    axisPointer: {
      lineStyle: {
        color: '#ffbd67'
      }
    },
    viewControl: {
      // projection: 'orthographic'
    },
    light: {
      main: {
        intensity: 1.2,
        shadow: false
      },
      ambient: {
        intensity: 0.3
      }
    }
  },
  series: [{
    type: 'bar3D',
    shading: 'lambert',

    label: {
      textStyle: {
        fontSize: 16,
        borderWidth: 1
      }
    },
    itemStyle: {
      opacity: 0.4
    },
    emphasis: {
      label: {
        textStyle: {
          fontSize: 20,
          color: '#aaa'
        }
      },
      itemStyle: {
        color: '#aaa'
      }
    }
  }]
}
