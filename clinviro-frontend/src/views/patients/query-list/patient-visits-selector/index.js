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
import Relay from 'react-relay/classic';
import moment from 'moment';

import style from './style.css';
import {DATE_FORMAT} from '../../../../constants';


class PatientVisitsSelector extends React.Component {

  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  static propTypes = {
    ptnum: PropTypes.string.isRequired
  }

  handleChange(e) {
    const {ptnum} = this.props;
    const id = e.currentTarget.value;
    this.context.router.push({
      pathname: `/patients/patient-${ptnum}/visits/${id}`
    });
  }

  render() {
    const {visits: {edges: visits}} = this.props;
    const len = visits.length;
    return <div className={style.patientVisitsSelector}>
      <label
       htmlFor="patientVisitId">{len} {len > 1 ? 'times' : 'time'}: </label>
      <select
       name="patientVisitId"
       defaultValue=""
       onChange={this.handleChange.bind(this)}>
        <option value="" disabled>
          Select a visit to open
        </option>
        {visits.map(({node: {id, collectedAt}}) => (
          <option key={id} value={id}>
            {moment(collectedAt).format(DATE_FORMAT)}
          </option>
        ))}
      </select>
    </div>;
  }

}

export default Relay.createContainer(
  PatientVisitsSelector,
  {
    fragments: {
      visits: () => Relay.QL`
        fragment on PatientVisitConnection {
          edges {
            node {
              id
              collectedAt
            }
          }
        }
      `
    }
  }
);
