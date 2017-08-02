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

class ProficiencySampleInfobox extends React.Component {

  static propTypes = {
    distance: PropTypes.number.isRequired
  }

  render() {
    const {proficiencySample: {
      name,
      source,
      vnum,
      testCode,
      receivedAt
    }, distance} = this.props;

    return <Infobox
      items={[{
        title: source,
        value: name
      }, {
        title: 'Accession #',
        value: vnum
      }, {
        title: 'Test code',
        value: testCode
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
  ProficiencySampleInfobox,
  {
    initialVariables: {},
    fragments: {
      proficiencySample: () => Relay.QL`
        fragment on ProficiencySample {
          id
          name
          source
          vnum
          testCode
          receivedAt
        }
      `
    }
  }
);
