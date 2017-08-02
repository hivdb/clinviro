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
import {itemsShape} from './props';
import style from './style.css';

export default class Infobox extends React.Component {

  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  static propTypes = {
    children: PropTypes.node,
    items: itemsShape,
    hoverTip: PropTypes.node,
    singleClick: PropTypes.bool.isRequired,
    linkTo: PropTypes.string
  }

  static defaultProps = {
    singleClick: false,
    items: []
  }

  handleDoubleClick(e) {
    const {onDoubleClick} = this.props;
    if (onDoubleClick) {
      onDoubleClick(e);
    }
    if (!e.defaultPrevented && e.currentTarget.dataset.to) {
      this.context.router.push({
        pathname: e.currentTarget.dataset.to
      });
    }
  }

  render() {
    const {children, singleClick, items, linkTo, hoverTip} = this.props;
    const props = Object.assign({}, this.props);
    let className = classNames(style.infobox, props.className);
    if (singleClick) {
      className = classNames(className, style.cursorPointer);
    }
    delete props.items;
    delete props.linkTo;
    delete props.hoverTip;
    delete props.children;
    delete props.singleClick;
    const onDoubleClick = this.handleDoubleClick.bind(this);
    const strHoverTip = typeof hoverTip === 'string';

    return (
      <div
       {...props}
       data-to={linkTo}
       {...(singleClick ? {onClick: onDoubleClick} : {onDoubleClick})}
       title={singleClick || !strHoverTip ? null : `Double click to ${hoverTip}`}
       className={className}>
        {children}
        {hoverTip ? <div className={style.hoverTip}>
          {strHoverTip ?
           linkTo ?
           <Link to={linkTo} title={`Click to ${hoverTip}`}>{hoverTip}</Link> :
           <a onClick={onDoubleClick}>{hoverTip}</a> :
           hoverTip}
        </div> : null}
        {items.map(({title, titlePlural, value}, idx) => {
          value = Array.isArray(value) ? value : [value];
          const isPlural = titlePlural && value.length > 1;
          return <div key={idx}>
            {title ?
             [<strong key={0}>{isPlural ? titlePlural : title}</strong>, ': '] :
             null}
            {value.map((val, idx) => {
              let className = style.one;
              if (typeof val === 'string' && val.indexOf(',') !== -1) {
                className = classNames(className, style.hasComma);
              }
              return <span className={className} key={idx}>{val}</span>;
            })}
          </div>;
        })}
      </div>);
  }

}
