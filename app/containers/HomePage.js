// @flow
import React, { Component } from 'react'
import 'echarts-gl'
import ReactEcharts from 'echarts-for-react'
import {ipcRenderer} from 'electron'
import moment from 'moment'
import 'moment-timezone'
import defaultOption from './option'
type Props = {};

moment.tz.setDefault('Asia/Shanghai')

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

  render() {
    const {option} = this.state
    const hasData = Object.keys(option).length > 0
    return (<div style={{width: '100%', height: '100%', minHeight: '100%', display: 'flex'}}>
      {hasData && <ReactEcharts ref={e => {this.chart = e}} option={option} style={{width: '100%', height: '100%'}} />}
      {!hasData && this._renderEmpty()}
    </div>);
  }
}
