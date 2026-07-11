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

import React from 'react';
import style from '../style.css';


export default class ValidationReportSection extends React.Component {

  render() {
    const {amplifiable, validation_results: validationResults} = this.props;

    if (!amplifiable) {
      return null;
    }
    return <section className={style.reportSection}>
      <h2>Sequence Quality Assessment</h2>
      {validationResults && validationResults.length > 0 ?
        <ul>
          {validationResults.map(({level_label, message}, idx) => (
            <li key={idx}>
              <strong>{level_label}</strong>: {message}
            </li>
          ))}
        </ul> :
        <p>There are no known sequence quality issues.</p>}
    </section>;
  }

}
