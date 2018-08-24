// @flow
import React, { Component } from 'react'
import 'echarts-gl'
import ReactEcharts from 'echarts-for-react'
import {ipcRenderer} from 'electron'
import moment from 'moment'
import 'moment-timezone'
import defaultOption from './option'
import Slider from 'rc-slider'

type Props = {};

moment.tz.setDefault('Asia/Shanghai')

const kMarks = {
1: '10min',
2: '30min',
3: '1h',
4: '4h',
5: '12h',
6: '1d',
7: '7d'
}

export default class HomePage extends Component<Props> {
  props: Props;

  constructor() {
    super()
    this.state = {option: {}}

    ipcRenderer.on('$file.load.csv', (event, data) => {
      this.updateData(data)
    })
  }

  updateData(data) {
    const [title, timeLabels, segments, finalData] = data
    defaultOption.title.text = title
    defaultOption.xAxis3D.data = timeLabels
    defaultOption.yAxis3D.data = segments
    defaultOption.series[0].data = finalData
    defaultOption.tooltip.formatter = (params) => {
      const [x, y, z] = params.value
      return `${timeLabels[x]} ${segments[y]} ${z}`
    }

    const option = Object.assign({}, defaultOption)
    this.setState({option})
    if (this.chart) {
      this.chart.getEchartsInstance().setOption(option)
    }
  }

  _renderEmpty() {
    return <div style={{margin: '30% 0 auto',
      position: 'relative',
      width: '100%'
    }}>
      <div style={{color: 'rgba(60, 63, 65, 0.75)',
        position: 'relative',
        width: '100%',
        wordWrap: 'break-word'}}>
        <p style={{fontSize: 28,
          fontWeight: 700,
          lineHeight: '34px',
          textAlign: 'center',
          margin: '0 auto'}}>请先选择CSV数据文件</p>
      </div>
    </div>
  }

  didSliderValueChanged(value) {
    console.log(value)
    if (value) {
      ipcRenderer.send('$view.chart.slider.changed', value)
    }
  }

  render() {
    const {option} = this.state
    const hasData = Object.keys(option).length > 0
    const sliderWrapper = {
      margin: '20px 40px', width: '400px', display: 'flex',
      alignSelf: 'flex-end', position: 'absolute', right: '100px',
      zIndex: 100
    }
    return (<div style={{width: '100%', height: '100%', minHeight: '100%', display: 'flex', flexDirection: 'column'}}>
      {hasData && (<div style={sliderWrapper}>
        <Slider min={1} marks={kMarks} step={null} onChange={this.didSliderValueChanged} defaultValue={1} max={7} />
      </div>)}
      {hasData && <ReactEcharts ref={e => {this.chart = e}} option={option} style={{width: '100%', height: '100%'}} />}
      {!hasData && this._renderEmpty()}
    </div>);
  }
}
