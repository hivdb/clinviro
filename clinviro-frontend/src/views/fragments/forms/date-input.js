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
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import FormGroup from './form-group';
import ValueViewer from './value-viewer';
import Messages, {messagesShape} from './messages';
import humanize from 'underscore.string/humanize';
import underscored from 'underscore.string/underscored';

import {DATE_FORMAT, SUPPORT_DATE_FORMATS} from '../../../constants';


export default class DateInput extends React.Component {

  static propTypes = {
    value: momentPropTypes.momentObj,
    openToDate: momentPropTypes.momentObj,
    maxDate: momentPropTypes.momentObj,
    minDate: momentPropTypes.momentObj,
    excludeDates: PropTypes.arrayOf(
      momentPropTypes.momentObj.isRequired),
    highlightDates: PropTypes.arrayOf(
      momentPropTypes.momentObj.isRequired),
    editableByDefault: PropTypes.bool.isRequired,
    readOnly: PropTypes.bool.isRequired,
    label: PropTypes.node.isRequired,
    name: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    messages: messagesShape.isRequired
  }

  static defaultProps = {
    editableByDefault: true,
    readOnly: false,
    label: 'Date',
    onChange: () => null,
    messages: [],
    value: null
  }

  constructor() {
    super(...arguments);
    const {editableByDefault, readOnly} = this.props;
    const editable = editableByDefault && !readOnly;
    this.state = {editable, focus: false};
  }

  makeEditable() {
    this.setState({editable: true, focus: true});
  }

  handleBlur() {
    const {editableByDefault} = this.props;
    if (!editableByDefault) {
      this.setState({editable: false, focus: false});
    }
  }

  render() {
    const {editable, focus} = this.state;
    const {label, name, messages,
           minDate, maxDate, readOnly, openToDate,
           onChange, excludeDates, highlightDates} = this.props;
    const value = moment(this.props.value);

    return (
      <FormGroup>
        <label htmlFor={underscored(name)}>{label ? label : humanize(label)}: </label>
        {editable ?
         <DatePicker
          name={underscored(name)}
          placeholderText={DATE_FORMAT}
          dateFormat={SUPPORT_DATE_FORMATS}
          onChange={onChange}
          autoFocus={focus}
          onBlur={this.handleBlur.bind(this)}
          minDate={minDate || moment().subtract(120, 'years')}
          maxDate={maxDate || moment()}
          excludeDates={excludeDates}
          highlightDates={highlightDates}
          openToDate={openToDate}
          peekNextMonth
          showMonthDropdown
          showYearDropdown
          selected={value && value.isValid() ? value : null}
          dropdownMode="select" /> :
         <ValueViewer
          readOnly={readOnly}
          makeEditable={this.makeEditable.bind(this)}>
           {value ? value.format(DATE_FORMAT) : null}
         </ValueViewer>}
        {messages.length ? <Messages messages={messages} /> : null}
      </FormGroup>
    );
  }

}
