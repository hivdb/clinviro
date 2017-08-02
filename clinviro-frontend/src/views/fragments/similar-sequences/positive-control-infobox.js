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

import {TIME_FORMAT} from '../../../constants';

class PositiveControlInfobox extends React.Component {

  static propTypes = {
    distance: PropTypes.number.isRequired
  }

  render() {
    const {positiveControl: {
      note,
      lotNumber,
      testCode,
      enteredAt
    }, distance} = this.props;

    return <Infobox
      items={[{
        value: <strong>Pos {note}</strong>
      }, {
        title: 'Lot #',
        value: lotNumber
      }, {
        title: 'Test code',
        value: testCode
      }, {
        title: 'Entered at',
        value: moment(enteredAt).format(TIME_FORMAT)
      }, {
        title: 'Distance',
        value: `${distance.toFixed(2)}%`
      }]} />;
  }

}


export default Relay.createContainer(
  PositiveControlInfobox,
  {
    initialVariables: {},
    fragments: {
      positiveControl: () => Relay.QL`
        fragment on PositiveControl {
          id
          note
          lotNumber
          testCode
          enteredAt
        }
      `
    }
  }
);
