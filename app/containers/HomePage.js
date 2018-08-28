// @flow
import React, { Component } from 'react'
import SplitPane from 'react-split-pane'
import 'echarts-gl'
import ReactEcharts from 'echarts-for-react'
import {ipcRenderer} from 'electron'
import moment from 'moment'
import 'moment-timezone'
import Slider from 'rc-slider'
import Sidebar from './Sidebar'
import Toolbar from './Toolbar'
import defaultOption from './option'

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


/**
 *
 * @param files
 */
function parseProjectTree(files) {
  const obj = {}
  files.forEach(file => {
    if (typeof file === 'string') {
      obj.module = file
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

  static didSliderValueChanged(value) {
    if (value) {
      ipcRenderer.send('$view.chart.slider.changed', value)
    }
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

  zoomOut = () => {
  }

  zoomIn = () => {

  }

  render() {
    const {option, tree} = this.state
    const hasData = Object.keys(option).length > 0
    const sliderWrapper = {
      margin: '20px 40px', width: '400px', display: 'flex',
      alignSelf: 'flex-end', position: 'absolute', right: '100px',
      zIndex: 100
    }
    return (<SplitPane split="vertical" minSize={200} defaultSize={200} maxSize={200}>
      <Sidebar tree={tree} />
      <SplitPane split="horizontal" minSize={28} maxSize={28} defaultSize={28}>
        <Toolbar zoomIn={this.zoomIn} zoomOut={this.zoomOut} />
      <div style={{width: '100%', height: '100%', minHeight: '100%', display: 'flex', flexDirection: 'column'}}>
        {hasData && (<div style={sliderWrapper}>
          <Slider min={1} marks={kMarks} step={null} onChange={HomePage.didSliderValueChanged} defaultValue={1} max={7} />
        </div>)}
        {hasData && <ReactEcharts ref={e => {this.chart = e}} option={option} style={{width: '100%', height: '100%'}} />}
        {!hasData && HomePage.renderEmpty()}
      </div>
      </SplitPane>
    </SplitPane>);
  }
}
