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
import style from '../style.css';

export default class ReportHeader extends React.Component {

  static propTypes = {
    items: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.node.isRequired,
        value: PropTypes.node.isRequired
      }).isRequired
    ).isRequired
  }

  render() {
    const {items} = this.props;
    const halfLen = Math.ceil(items.length / 2);

    return <section className={style.reportSection}>
      <table className={classNames(style.headerTable, style.keywordTable)}>
        <tbody>
          {(() => {
            const r = [];
            for (let i = 0; i < halfLen; i ++) {
              const leftItem = items[i * 2];
              const rightItem = items[i * 2 + 1];
              r.push(<tr key={i}>
                <th>{leftItem.name}</th>
                <td>{leftItem.value}</td>
                <th>{rightItem ? `${rightItem.name}` : null}</th>
                <td>{rightItem ? rightItem.value : null}</td>
              </tr>);
            }
            return r;
          })()}
        </tbody>
      </table>
    </section>;
  }
}
