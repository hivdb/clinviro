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

export default class PreviewPatientReport extends Relay.Mutation {

  getMutation() {
    return Relay.QL`mutation { previewPatientReport }`;
  }

  getVariables() {
    let {ptnum, lastname, firstname, birthday, mrid, collectedAt, sample} = this.props;
    ptnum = ptnum || null;
    birthday = birthday.format('YYYY-MM-DD');
    collectedAt = collectedAt.format('YYYY-MM-DD');
    let {
      sequence, isAmplifiable, receivedAt,
      notes, labnotes, ...others} = sample;
    sample = others;
    sample.specimenType = 'plasma';
    sample.receivedAt = receivedAt.format('YYYY-MM-DD');
    sample.sequence = isAmplifiable ? sequence.sequence : null;
    sample.filename = isAmplifiable ? sequence.fileName : null;
    sample.notes = notes.trim();
    sample.labnotes = labnotes.trim();
    sample.amplifiable = isAmplifiable;
    return {ptnum, lastname, firstname, birthday, mrid, collectedAt, sample};
  }

  getFatQuery() {
    return Relay.QL`
      fragment on PreviewPatientReportPayload {
        data
      }
    `;
  }

  getConfigs() {
    return [{
      type: 'REQUIRED_CHILDREN',
      children: [
        Relay.QL`
          fragment on PreviewPatientReportPayload {
            data
          }
        `
      ]
    }];
  }

}
