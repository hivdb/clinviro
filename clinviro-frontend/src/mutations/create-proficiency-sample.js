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


export function processProfSampleInput(props) {
  let {name, source, vnum, testCode, sequence, notes, labnotes, receivedAt} = props;
  const filename = sequence.fileName;
  name = name.trim();
  source = source.trim();
  vnum = vnum.trim();
  sequence = sequence.sequence;
  notes = notes.trim();
  labnotes = labnotes.trim();
  receivedAt = receivedAt.format('YYYY-MM-DD');
  return {
    name, source, vnum, testCode, filename,
    sequence, notes, labnotes, receivedAt
  };
}


export default class CreateProficiencySample extends Relay.Mutation {

  getMutation() {
    return Relay.QL`mutation { createProficiencySample }`;
  }

  getVariables() {
    return processProfSampleInput(this.props);
  }

  getFatQuery() {
    return Relay.QL`
      fragment on CreateProficiencySamplePayload {
        proficiencySample { id }
      }
    `;
  }

  getConfigs() {
    return [{
      type: 'REQUIRED_CHILDREN',
      children: [
        Relay.QL`
          fragment on CreateProficiencySamplePayload {
            proficiencySample {
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
