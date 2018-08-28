import React, {PureComponent} from 'react'
import styles from './segment.css'

type Props = {
  label: string,
  content: any,
  children: any
}

export default class Segment extends PureComponent<Props> {
  render() {
    const {label, content, children} = this.props
    return (<div className={styles.segment}>
      <div className={styles.title}>{label}</div>
      {content || children}
    </div>)
  }
}
