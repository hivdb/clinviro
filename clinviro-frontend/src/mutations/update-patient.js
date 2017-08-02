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

export default class UpdatePatient extends Relay.Mutation {

  getMutation() {
    return Relay.QL`mutation { updatePatient }`;
  }

  getVariables() {
    let {ptnum, lastname, firstname,
         birthday, newMrids, mergeMrids} = this.props;
    lastname = lastname.trim();
    firstname = firstname.trim();
    birthday = birthday.format('YYYY-MM-DD');
    return {ptnum, lastname, firstname, birthday, newMrids, mergeMrids};
  }

  getFatQuery() {
    return Relay.QL`
      fragment on UpdatePatientPayload @relay(pattern: true) {
        patient {
          id
          ptnum
          lastname
          firstname
          birthday
          medicalRecords { mrid, visitsCount }
          visits {
            edges {
              node {
                id
                mrid
              }
    }
          }
        }
      }
    `;
  }

  getConfigs() {
    return [{
      type: 'FIELDS_CHANGE',
      fieldIDs: {
        patient: this.props.patient.id
      }
    }];
  }

  static fragments = {
    patient: () => Relay.QL`
      fragment on Patient {
        id
      }
    `
  }

}
