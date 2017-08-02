/**
 * ClinViro
 * Copyright (C) 2017 Stanford HIVDB team.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.

 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import IonClose from 'react-icons/lib/io/close';

import style from './style.css';

export default class Dialog extends React.Component {

  static propTypes = {
    onClose: PropTypes.func.isRequired,
    closeOnBlur: PropTypes.bool.isRequired,
    width: PropTypes.oneOfType([
      PropTypes.number, PropTypes.string]),
    children: PropTypes.node.isRequired
  }

  static childContextTypes = {
    closeDialog: PropTypes.func.isRequired
  }

  static defaultProps = {
    closeOnBlur: true
  }

  getChildContext() {
    return {
      closeDialog: this.handleClose.bind(this)
    };
  }

  constructor() {
    super(...arguments);
    this.state = {className: style.modal};
  }

  handleClose() {
    const {onClose} = this.props;
    this.setState({className: classNames(style.modal, style.closing)});
    setTimeout(onClose, 450);
  }

  handleModalClick(e) {
    const {closeOnBlur} = this.props;
    if (closeOnBlur && e.target.className === style.modal) {
      this.handleClose();
    }
  }

  render() {
    const {className} = this.state;
    let {children, width, ...props} = this.props;
    delete props.onClose;
    delete props.closeOnBlur;

    const addStyle = {};
    if (width) {
      addStyle.width = width;
    }

    return (
      <div {...props} className={className}
       onClick={this.handleModalClick.bind(this)}>
        <div className={style.dialog} style={addStyle}>
          <button
           type="button" role="button"
           name="close" onClick={this.handleClose.bind(this)}>
            <IonClose />
          </button>
          <div className={style.dialogContainer}>
            {children}
          </div>
        </div>
      </div>
    );
  }
}
