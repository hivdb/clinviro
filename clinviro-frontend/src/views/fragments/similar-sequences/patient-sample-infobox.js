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
import Infobox from '../infobox';

import {DATE_FORMAT} from '../../../constants';

class PatientSampleInfobox extends React.Component {

  static propTypes = {
    distance: PropTypes.number.isRequired
  }

  render() {
    if (!('visit' in this.props.patientSample)) {
      // still not sure why but this crash the program
      return null;
    }
    const {patientSample: {
      vnum, testCode, receivedAt,
      visit: {
        patient: { firstname, lastname, birthday },
        mrid
      }
    }, distance} = this.props;

    return <Infobox
      items={[{
        title: 'Patient',
        value: [
          firstname ? `${lastname}, ${firstname}` : lastname,
          birthday ? `(DOB: ${moment(birthday).format(DATE_FORMAT)})` : ''
        ].join(' ').trim()
      }, {
        title: 'MRN',
        value: mrid || '-'
      }, {
        title: 'Accession #',
        value: `${vnum} (Test code: ${testCode})`
      }, {
        title: 'Received on',
        value: moment(receivedAt).format(DATE_FORMAT)
      }, {
        title: 'Distance',
        value: `${distance.toFixed(2)}%`
      }]} />;
  }

}


export default Relay.createContainer(
  PatientSampleInfobox,
  {
    initialVariables: {},
    fragments: {
      patientSample: () => Relay.QL`
        fragment on PatientSample {
          id
          vnum
          testCode
          receivedAt
          visit {
            patient {
              firstname
              lastname
              birthday
            }
            mrid
          }
        }
      `
    }
  }
);
