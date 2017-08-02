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
import {Link} from 'react-router';


export default class Home extends React.Component {

  render() {
    return <div>
      <section>
        <h2>Patients</h2>
        <ul>
          <li><Link to="/patients/new-sample">Input new patient sample, get report and/or enter into database</Link></li>
          <li><Link to="/patients">List/search patients</Link></li>
          <li><Link to="/patients/daily-reports">List patient reports by dates</Link></li>
        </ul>
      </section>
      <section>
        <h2>Proficiency Samples</h2>
        <ul>
          <li><Link to="/proficiency-samples/new">Input new proficiency sample and get report</Link></li>
          <li><Link to="/proficiency-samples">List/search proficiency samples</Link></li>
        </ul>
      </section>
      <section>
        <h2>Positive Control Sequences</h2>
        <ul>
          <li><Link to="/positive-controls/new">Input new positive control sequence and get report</Link></li>
          <li><Link to="/positive-controls">List/search positive control sequences</Link></li>
        </ul>
      </section>
    </div>;
  }

}
