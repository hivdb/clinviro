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

export function preparePatientSampleInput(sample) {
  let {
    sequence, isAmplifiable, receivedAt,
    notes, labnotes, ...others} = sample;
  sample = others;
  delete sample.disabled;
  delete sample.isApproved;
  sample.specimenType = 'plasma';
  sample.receivedAt = receivedAt.format('YYYY-MM-DD');
  sample.sequence = isAmplifiable ? sequence.sequence : null;
  sample.filename = isAmplifiable ? sequence.fileName : null;
  sample.notes = notes.trim();
  sample.labnotes = labnotes.trim();
  sample.amplifiable = isAmplifiable;
  return sample;
}


export default class UpdatePatientSample extends Relay.Mutation {

  getMutation() {
    return Relay.QL`mutation { updatePatientSample }`;
  }

  getVariables() {
    let {sampleId, mrid, collectedAt, manuallyApproved, sample} = this.props.visit;
    collectedAt = collectedAt.format('YYYY-MM-DD');
    sample = preparePatientSampleInput(sample);
    manuallyApproved = manuallyApproved || false;
    return {id: sampleId, mrid, collectedAt, sample, manuallyApproved};
  }

  getFatQuery() {
    return Relay.QL`
      fragment on UpdatePatientSamplePayload {
        updatedPatientVisit {
          id
          ptnum
        }
        updatedPatientSample {
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
          fragment on UpdatePatientSamplePayload {
            updatedPatientVisit { id, ptnum }
            updatedPatientSample {
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
