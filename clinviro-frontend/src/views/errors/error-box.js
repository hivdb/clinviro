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

import style from './style.css';

export default class ErrorBox extends React.Component {

  static propTypes = {
    narrow: PropTypes.bool.isRequired,
    IconComponent: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired
  }

  static defaultProps = {
    narrow: false
  }

  render() {
    const {narrow, IconComponent, children} = this.props;
    let className = style.errorBox;
    if (narrow) {
      className = classNames(className, style.narrow);
    }
    return (
      <div className={className}>
        {IconComponent ? <IconComponent className={style.errorIcon} /> : null}
        <div className={style.errorMsg}>{children}</div>
      </div>
    );
  }

}
