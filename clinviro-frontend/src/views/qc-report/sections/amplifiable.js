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

export default class AmplifiableSection extends React.Component {

  render() {
    const {amplifiable} = this.props;

    if (!amplifiable) {
      return <section className={style.reportSection}>
        <h2>No results obtained</h2>
        <p>
          No DNA band was obtained following viral RNA extraction and RT-PCR. This usually occurs as a result of the sample having a low virus load. It occurs less commonly as a result of viral RNA degradation in transit. Whole blood sample must be spun within 6 hours of collection, and room temperature plasma received within 24 hours. Frozen plasma (&lt;20 deg. Celsius or dry ice) is stable.
        </p>
      </section>;
    }
    return null;
  }

}
