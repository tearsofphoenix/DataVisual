import React, {PureComponent} from 'react'
import cx from 'classnames'
import Slider from 'rc-slider'
import { ipcRenderer } from "electron"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronRight, faChevronLeft } from '@fortawesome/free-solid-svg-icons'
import styles from './segment.css'
import ViewModeControl from './ViewModeControl'

const kMarks = {
  1: '10min',
  2: '30min',
  3: '1h',
  4: '4h',
  5: '12h',
  6: '1d',
  7: '7d'
}

export default class ControlPanel extends PureComponent {
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
      content = (<div className={styles.controlpanel}>
        <div className={styles['controlpanel-header']}>控制面板
          <div className={styles['controlpanel-icon']} onClick={this.showMinium}>
            <FontAwesomeIcon icon={faChevronRight} />
          </div>
        </div>
        <ViewModeControl />
        <div className={styles['slider-wrapper']}>
          <Slider min={1} marks={kMarks} step={null} onChange={ControlPanel.didSliderValueChanged} defaultValue={1}
                  max={7} />
        </div>
      </div>)
    }

    return content
  }
}
