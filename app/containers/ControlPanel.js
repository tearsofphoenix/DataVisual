import React, {PureComponent} from 'react'
import cx from 'classnames'
import Slider from 'rc-slider'
import { ipcRenderer } from "electron"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronRight, faChevronLeft } from '@fortawesome/free-solid-svg-icons'
import styles from './segment.css'
import ViewModeControl from './ViewModeControl'
import Segment from '../components/Segment'

const kTimeScales = [
  {value: 1, name: '10min'},
  {value: 2, name: '30min'},
  {value: 3, name: '1h'},
  {value: 4, name: '4h'},
  {value: 5, name: '12h'},
  {value: 6, name: '1d'},
  {value: 7, name: '7d'},
]

const kMaxOpacity = 100

type Props = {
  updateOpacity: any
}

export default class ControlPanel extends PureComponent<Props> {
  static didSliderValueChanged(value) {
    if (value) {
      ipcRenderer.send('$view.chart.slider.changed', value)
    }
  }

  constructor(props) {
    super(props)
    this.state = {minium: false}
  }

  showMinium = () => {
    this.setState({minium: true})
  }

  showFull = () => {
    this.setState({minium: false})
  }

  didChangeTimeScale = (event) => {
    const {value} = event.target
    ControlPanel.didSliderValueChanged(value)
  }

  didChangeOpacity = (value) => {
    this.props.updateOpacity(value * 1.0 / kMaxOpacity)
  }

  render() {
    const {minium} = this.state
    let content
    if (minium) {
      content = (
        <div className={styles.controlpanel}>
          <div className={cx(styles['controlpanel-header'], styles['controlpanel-minium'])}>
            <div className={styles['controlpanel-icon']} onClick={this.showFull}>
              <FontAwesomeIcon icon={faChevronLeft} />
            </div>
          </div>
        </div>)
    } else {
      content = (<div className={cx(styles.controlpanel, styles['controlpanel-full'])}>
        <div className={styles['controlpanel-header']}>控制面板
          <div className={styles['controlpanel-icon']} onClick={this.showMinium}>
            <FontAwesomeIcon icon={faChevronRight} />
          </div>
        </div>
        <ViewModeControl />
        <Segment label="透明度：">
          <div className={styles['slider-wrapper']}>
            <Slider min={0} max={kMaxOpacity} defaultValue={kMaxOpacity} onChange={this.didChangeOpacity} />
          </div>
        </Segment>
        <Segment label="时间粒度：">
          <select className={styles.selection} onChange={this.didChangeTimeScale}>
            {kTimeScales.map(({value, name}) => <option value={value} key={value} className={styles.option}>{name}</option>)}
          </select>
        </Segment>
      </div>)
    }

    return content
  }
}
