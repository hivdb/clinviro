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
import {Link} from 'react-router';
import classNames from 'classnames';
import style from './style.css';

const BUTTON_STYLES = ['default', 'primary', 'info', 'info2'];
const BUTTON_SIZES = ['normal', 'large', 'small'];


export default class Button extends React.Component {

  static propTypes = {
    onClick: PropTypes.func,
    btnStyle: PropTypes.oneOf(BUTTON_STYLES).isRequired,
    btnSize: PropTypes.oneOf(BUTTON_SIZES).isRequired,
    margin: PropTypes.string.isRequired,
    className: PropTypes.string,
    href: PropTypes.string,
    to: PropTypes.string,
    disabled: PropTypes.bool.isRequired,
    type: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired
  }

  static defaultProps = {
    btnStyle: 'default',
    margin: '',
    btnSize: 'normal',
    disabled: false,
    type: 'button',
    children: ''
  }

  render() {
    let {
      btnStyle, btnSize, href, to, margin, className, type, ...props} = this.props;
    margin = margin.toLowerCase().replace(' ', '').split(',');
    props.className = classNames(
      style.btn,
      style[`${btnStyle}Btn`],
      style[`${btnSize}SzBtn`],
      margin.indexOf('left') > -1 ? style.marLeft : null,
      margin.indexOf('right') > -1 ? style.marRight : null,
      className);
    if (href) {
      return <a href={href} {...props} />;
    } else if (to) {
      return <Link to={to} {...props} />;
    } else {
      return <button type={type} {...props} />;
    }
  }
    

}
