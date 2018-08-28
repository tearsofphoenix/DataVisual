// @flow
import React, { Component } from 'react'
import SplitPane from 'react-split-pane'
import 'echarts-gl'
import ReactEcharts from 'echarts-for-react'
import {ipcRenderer} from 'electron'
import moment from 'moment'
import 'moment-timezone'

import Sidebar from './Sidebar'
import Toolbar from './Toolbar'
import defaultOption from './option'
import ControlPanel from './ControlPanel'

type Props = {};

moment.tz.setDefault('Asia/Shanghai')

/**
 *
 * @param files
 */
function parseProjectTree(files) {
  const obj = {}
  files.forEach(file => {
    if (typeof file === 'string') {
      const parts = file.split('\\')
      obj.module = parts[parts.length - 1]
      obj.path  = file
      obj.children = []
    }
  })
  return obj
}

export default class HomePage extends Component<Props> {
  props: Props;

  static renderEmpty() {
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

  constructor() {
    super()
    this.state = {
      option: {}, tree: {}
    }

    ipcRenderer.on('$file.load.csv', (event, data) => {
      this.updateData(data)
    })
    ipcRenderer.on('$chart.get.image', () => {
      if (this.chart) {
        const url = this.chart.getEchartsInstance().getDataURL({backgroundColor: '#aaa'})
        ipcRenderer.send('$chart.did-get.image', url)
      }
    })

    ipcRenderer.on('$project.show.tree', (event, args) => {
      this.setState({tree: parseProjectTree(args)})
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

  updateOpacity = (opacity) => {
    if(opacity > 1) {
      opacity = 1
    }
    if (opacity < 0) {
      opacity = 0
    }
    if (this.chart) {
      let {option} = this.state
      option = {...option}
      option.series[0].itemStyle.opacity = opacity
      this.chart.getEchartsInstance().setOption(option)
    }
  }

  zoomOut = () => {
  }

  zoomIn = () => {

  }

  render() {
    const {option, tree} = this.state
    const hasData = Object.keys(option).length > 0

    return (<SplitPane split="vertical" minSize={200} defaultSize={200} maxSize={200}>
      <Sidebar tree={tree} />
      <SplitPane split="horizontal" minSize={28} maxSize={28} defaultSize={28}>
        <Toolbar zoomIn={this.zoomIn} zoomOut={this.zoomOut} />
      <div style={{width: '100%', height: '100%', minHeight: '100%', display: 'flex', flexDirection: 'column'}}>
        {hasData && <ControlPanel updateOpacity={this.updateOpacity} />}
        {hasData && <ReactEcharts ref={e => {this.chart = e}} option={option} style={{width: '100%', height: '100%'}} />}
        {!hasData && HomePage.renderEmpty()}
      </div>
      </SplitPane>
    </SplitPane>);
  }
}
