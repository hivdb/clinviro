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
import Messages from './messages';
import style from './style.css';

export class FormInline extends React.Component {

  render() {
    let {className} = this.props;
    className = classNames(className, style.formInline);
    return <form {...this.props} className={className} />;
  }

}

export class FormHorizental extends React.Component {

  static propTypes = {
    className: PropTypes.string,
    children: PropTypes.node.isRequired,
    invalid: PropTypes.bool.isRequired
  }

  static defaultProps = {
    invalid: false
  }

  render() {
    let {className, invalid, children, ...props} = this.props;
    className = classNames(className, style.formHorizontal);
    return <form {...props} className={className}>
      {invalid ? <Messages messages={[{
        text: 'Please fix following errors.',
        level: 'error'
      }]} /> : null}
      {children}
    </form>;
  }

}
