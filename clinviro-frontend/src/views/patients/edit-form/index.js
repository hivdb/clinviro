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
import Levenshtein from 'levenshtein';
import momentPropTypes from 'react-moment-proptypes';
import {FormHorizental, MRIDInput, FormButtons,
        FullnameInput, BirthdayInput,
        checkMessagesOnSubmit} from '../../fragments/forms';
import {validateFullname, checkRequired} from '../validators';


export default class PatientEditForm extends React.Component {

  static propTypes = {
    onChange: PropTypes.func.isRequired,
    onSubmit: PropTypes.func,
    onReset: PropTypes.func,
    lastname: PropTypes.string.isRequired,
    firstname: PropTypes.string.isRequired,
    fullname: PropTypes.string.isRequired,
    editableByDefault: PropTypes.bool.isRequired,
    readOnly: PropTypes.bool.isRequired,
    mrids: PropTypes.arrayOf(
      PropTypes.string.isRequired
    ).isRequired,
    indelibleMRIDs: PropTypes.arrayOf(
      PropTypes.string.isRequired
    ).isRequired,
    activeMRID: PropTypes.string.isRequired,
    mergedMRIDs: PropTypes.object.isRequired,
    submitText: PropTypes.string.isRequired,
    showSubmit: PropTypes.bool.isRequired,
    showReset: PropTypes.bool.isRequired,
    birthday: momentPropTypes.momentObj
  }

  static defaultProps = {
    onReset: null,
    onSubmit: null,
    lastname: '',
    firstname: '',
    fullname: '',
    mrids: [],
    indelibleMRIDs: [],
    mergedMRIDs: {},
    activeMRID: '',
    editableByDefault: true,
    submitText: 'Add patient',
    showSubmit: true,
    showReset: true,
    birthday: null
  }

  constructor() {
    super(...arguments);
    this.state = {invalid: false};
  }

  handleNameChange({value, lastname, firstname}) {
    this.props.onChange({fullname: value, lastname, firstname});
  }

  handleBirthdayChange(birthday) {
    this.props.onChange({birthday});
  }

  handleMRIDChange(props) {
    this.props.onChange(props);
  }

  handleSubmit(e) {
    const {onSubmit} = this.props;
    const messages = (
      this.validateFullname(true)
      .concat(this.validateDOB(true))
      .concat(this.validateMRIDs(true)));

    checkMessagesOnSubmit(
      messages, () => onSubmit(e),
      () => this.setState({invalid: true}));
    e && e.preventDefault();
  }

  handleReset() {
    const {onReset} = this.props;
    this.setState({invalid: false});
    onReset();
  }

  validateFullname(required = false) {
    const {fullname} = this.props;
    return validateFullname(fullname, required);
  }

  validateDOB(required = false) {
    const {birthday} = this.props;
    return checkRequired(birthday, required);
  }

  validateMRIDs(required = false) {
    const threshold = 0.2;
    const {mrids} = this.props;
    const messages = [];
    if (required && mrids.length === 0) {
      messages.push({
        text: 'At least one medical record number is required.',
        level: 'error'
      });
    }
    for (const i in mrids) {
      for (const j in mrids) {
        if (i >= j) { continue; }
        const left = mrids[i].replace(/^0+/, '');
        const right = mrids[j].replace(/^0+/, '');
        const {distance} = new Levenshtein(left, right);
        const base = Math.max(left.length, right.length);
        if (distance / base <= threshold) {
          messages.push({
            text: (`The two MRNs "${mrids[i]}" and "${mrids[j]}" are too ` +
                   'similar. Please check if there are mistakes.'),
            level: 'warning'
          });
        }
      }
    }
    for (const mrid of mrids) {
      if (!/^\d+$/.test(mrid)) {
        messages.push({
          text: (`MRN "${mrid}" contains non-numeric characters. ` +
                 'Please check if there is a mistake.'),
          level: 'warning'
        });
      }
    }
    return messages;
  }

  render() {
    const {invalid} = this.state;
    const {fullname, birthday, mrids, activeMRID, indelibleMRIDs,
           mergedMRIDs, showSubmit, showReset, submitText,
           editableByDefault, readOnly} = this.props;

    return (
      <FormHorizental
       onReset={this.handleReset.bind(this)}
       onSubmit={this.handleSubmit.bind(this)}>
        <FullnameInput
         {...{editableByDefault, readOnly}}
         messages={this.validateFullname(invalid)}
         value={fullname}
         onChange={this.handleNameChange.bind(this)} />
        <MRIDInput
         {...{editableByDefault, readOnly}}
         activeValue={activeMRID}
         messages={this.validateMRIDs(invalid)}
         indelibleMRIDs={indelibleMRIDs}
         mergedMRIDs={mergedMRIDs}
         value={mrids}
         onChange={this.handleMRIDChange.bind(this)} />
        <BirthdayInput
         {...{editableByDefault, readOnly}}
         messages={this.validateDOB(invalid)}
         value={birthday}
         onChange={this.handleBirthdayChange.bind(this)} />
        <FormButtons
         {...{submitText, showSubmit, showReset}} />
      </FormHorizental>);
  }

}
