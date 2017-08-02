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
import style from './style.css';
import humanize from 'underscore.string/humanize';
import underscored from 'underscore.string/underscored';

import classNames from 'classnames';

export default class CheckboxInput extends React.Component {

  static propTypes = {
    name: PropTypes.string.isRequired,
    value: PropTypes.any,
    className: PropTypes.string,
    label: PropTypes.node,
    children: PropTypes.node,
    onChange: PropTypes.func.isRequired,
    checked: PropTypes.bool,
    disabled: PropTypes.bool.isRequired,
    style: PropTypes.object.isRequired,
    noLabel: PropTypes.bool.isRequired
  }

  static defaultProps = {
    disabled: false,
    className: null,
    style: {},
    noLabel: false
  }

  render() {
    let {
      name, children, label, checked,
      style: userStyle, noLabel, className, ...props
    } = this.props;
    children = children ? children : label ? label : humanize(name);
    name = underscored(name);
    return (
      <span className={classNames(style.checkboxInput, className)}>
        <input
         id={name} name={name} checked={checked} {...props}
         type="checkbox" />
        {noLabel ? null :
         <label
          style={userStyle}
          htmlFor={name}>
           {children}
         </label>}
      </span>
    );
  }
}
