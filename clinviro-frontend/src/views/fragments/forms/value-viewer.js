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


export default class ValueViewer extends React.Component {

  static propTypes = {
    readOnly: PropTypes.bool.isRequired,
    makeEditable: PropTypes.func.isRequired,
    emptyText: PropTypes.node.isRequired,
    children: PropTypes.node
  }

  static defaultProps = {
    readOnly: false,
    makeEditable: () => null,
    emptyText: 'Unknown'
  }

  constructor() {
    super(...arguments);
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(e) {
    e.preventDefault();
    this.props.makeEditable();
  }

  render() {
    let {readOnly, children, emptyText, className} = this.props;
    const props = Object.assign({}, this.props);
    className = classNames(className, style.valueViewer);
    if (readOnly) {
      className = classNames(className, style.readOnly);
    }

    delete props.readOnly;
    delete props.children;
    delete props.emptyText;
    delete props.makeEditable;
    return(
      <div
       {...props}
       onDoubleClick={readOnly ? null : this.handleClick}
       className={className}>
        {children ? children :
         <span className={style.trivia}>{emptyText}</span>}
        {readOnly ? null : <a href="#" onClick={this.handleClick}>
           (edit)
         </a>}
      </div>
    );
  }

}
