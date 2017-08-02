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
import FaPlus from 'react-icons/lib/fa/plus';
import Infobox from './index';
import {itemsShape} from './props';
import style from './style.css';


export default class InfoboxPlaceholder extends React.Component {

  static propTypes = {
    linkTo: PropTypes.string.isRequired,
    items: itemsShape.isRequired,
    children: PropTypes.string.isRequired
  }

  static defaultProps = {
    items: [{
      title: 'MRN',
      value: '12345678'
    }, {
      title: 'Physician',
      value: 'McCoy, Leonard'
    }, {
      title: 'clinic',
      value: 'Starfleet Medical'
    }, {
      title: 'Collected on',
      value: '2347-06-18'
    }, {
      value: 'To boldly go where no man has gone before.'
    }]
  }

  render() {
    const {linkTo, items, children} = this.props;
    return (
      <Infobox
       linkTo={linkTo}
       singleClick={true}
       className={style.infoboxPlaceholder}
       items={items}>
        <Link to={linkTo} className={style.infoboxPlaceholderContainer}>
          <div className={style.infoboxPlaceholderIcon}><FaPlus /></div>
          <div className={style.infoboxPlaceholderText}>{children}</div>
        </Link>
      </Infobox>
    );
  }
}
