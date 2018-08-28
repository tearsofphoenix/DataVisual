// @flow
import React, { Component } from 'react'
import cx from 'classnames'
import Tree from 'react-ui-tree'

type Props = {};

export default class Sidebar extends Component<Props> {
  props: Props;

  constructor() {
    super()
    this.state = {
      tree: {},
      active: null
    }

  }

  renderNode = node => {
    const {active} = this.state
    const className = cx('node', {
      'is-active': node === active
    })
    return (
      <span
        role="item"
        className={className}
        onClick={() => this.onClickNode(node)}
      >
        {node.module}
      </span>
    );
  };

  onClickNode = node => {
    this.setState({
      active: node
    });
  };

  handleChange = tree => {
    this.setState({ tree });
  };

  updateTree = () => {
    const { tree } = this.state;
    tree.children.push({ module: 'test' });
    this.setState({ tree });
  };

  render() {
    const {tree} = this.state
    return (
        <div className="tree">
          <Tree
            paddingLeft={20}
            tree={tree}
            onChange={this.handleChange}
            isNodeCollapsed={this.isNodeCollapsed}
            renderNode={this.renderNode}
          />
        </div>
    );
  }
}
