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

import Relay from 'react-relay/classic';
import {preparePatientSampleInput} from './update-patient-sample';

export default class CreatePatientVisit extends Relay.Mutation {

  getMutation() {
    return Relay.QL`mutation { createPatientVisit }`;
  }

  getVariables() {
    let {ptnum, mrid, collectedAt, sample} = this.props.visit;
    collectedAt = collectedAt.format('YYYY-MM-DD');
    sample = preparePatientSampleInput(sample);
    return {ptnum, mrid, collectedAt, sample};
  }

  getFatQuery() {
    return Relay.QL`
      fragment on CreatePatientVisitPayload {
        patientVisit {
          id
          ptnum
        }
        patientSample {
          id
        }
      }
    `;
  }

  getConfigs() {
    return [{
      type: 'REQUIRED_CHILDREN',
      children: [
        Relay.QL`
          fragment on CreatePatientVisitPayload {
            patientVisit { id, ptnum }
            patientSample {
              id 
              latestReports {
                content
                contentType
              }
            }
          }
        `
      ]
    }];
  }

}
