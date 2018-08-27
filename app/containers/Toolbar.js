// @flow
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCoffee, faPlus, faMinus } from '@fortawesome/free-solid-svg-icons'

type Props = {
  zoomIn: any,
  zoomOut: any
};

const wrapperStyle = {
  display: 'flex',
  width: '100%',
  alignItems: 'center',
  justifyContent: 'space-between',
  color: '#AFB1B3',
  background: '#3C3F41',
  padding: '2px 0'
}

const rightStyle = {
  display: 'flex',
  marginRight: '4px'
}

const iconWrapper = {
  width: '1em',
  height: '1em',
  margin: '0 4px'
}

const ItemWrapper = (props) => {
  const {children, ...rest} = props
  return (<div style={iconWrapper} {...rest}>{children}</div>)
}

export default class Toolbar extends Component<Props> {
  props: Props;

  constructor() {
    super()
    this.state = {option: {}}

  }

  render() {
    const {zoomIn, zoomOut} = this.props
    return (<div style={wrapperStyle}>
      <div></div>
      <div style={rightStyle}>
        <ItemWrapper onClick={zoomOut}><FontAwesomeIcon icon={faMinus} /></ItemWrapper>
        <ItemWrapper onClick={zoomIn}><FontAwesomeIcon icon={faPlus} /></ItemWrapper>
      </div>
    </div>);
  }
}
