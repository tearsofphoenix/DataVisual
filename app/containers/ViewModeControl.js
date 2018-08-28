import React, {PureComponent} from 'react'
import cx from 'classnames'
import Segment from '../components/Segment'
import styles from './segment.css'

type Props = {
  didSwitchViewMode: any
}

export default class ViewModeControl extends PureComponent<Props> {
  constructor(props) {
    super(props)
    this.state = {
      selected: 0
    }
  }

  selectAt = (idx) => {
    this.setState({selected: idx})
    this.props.didSwitchViewMode(idx)
  }

  render() {
    const {selected} = this.state
    const className = (idx) => cx(styles.item, idx === selected ? styles['item-selected'] : '')
    return (<Segment label="视图：">
      <div className={styles['item-wrapper']}>
        <div className={className(0)} onClick={() => this.selectAt(0)}>3D</div>
        <div className={className(1)} onClick={() => this.selectAt(1)}>日期</div>
        <div className={className(2)} onClick={() => this.selectAt(2)}>时长</div>
      </div>
    </Segment>)
  }
}
