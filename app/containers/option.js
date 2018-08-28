export const kTimeOption = {
  title: {
    textStyle: {
      align: 'center',
      color: '#aaa'
    }
  },
  color: ['#3398DB'],
  textStyle: {
    color: '#aaa'
  },
  tooltip : {
    trigger: 'axis',
    axisPointer : {            // 坐标轴指示器，坐标轴触发有效
      type : 'shadow'        // 默认为直线，可选为：'line' | 'shadow'
    }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis : [
    {
      type : 'category',
      data : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      axisTick: {
        alignWithLabel: true
      }
    }
  ],
  yAxis : [
    {
      type : 'value'
    }
  ],
  series : [
    {
      name:'数量',
      type:'bar',
      barWidth: '60%',
      data: [10, 52, 200, 334, 390, 330, 220]
    }
  ]
};

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
      opacity: 1
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
