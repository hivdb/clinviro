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
import moment from 'moment';
import momentPropTypes from 'react-moment-proptypes';
import 'react-datepicker/dist/react-datepicker.css';
import DateInput from './date-input';


export default class BirthdayInput extends React.Component {

  static propTypes = {
    value: momentPropTypes.momentObj,
    editableByDefault: PropTypes.bool.isRequired,
    onChange: PropTypes.func.isRequired
  }

  static defaultProps = {
    editableByDefault: true,
    value: null,
    onChange: () => null
  }

  render() {
    return (
      <DateInput
       {...this.props} name="birthday" label="DOB"
       openToDate={moment().subtract(29, 'years').startOf('year')} />
    );
  }

}
