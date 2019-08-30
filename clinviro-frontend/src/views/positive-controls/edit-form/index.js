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
import momentPropTypes from 'react-moment-proptypes';
import {FormHorizental, FormButtons, TextInput, ReadOnlyInput,
        SequenceInput, FormSelect, TextArea, testTestCode,
        checkMessagesOnSubmit, style as formStyle} from '../../fragments/forms';
import {checkRequired} from '../validators';
import {TEST_CODE_OPTIONS} from '../../../constants';
import {sequenceShape} from '../../fragments/forms';


export default class PositiveControlEditForm extends React.Component {

  static propTypes = {
    onChange: PropTypes.func.isRequired,
    onSubmit: PropTypes.func,
    onReset: PropTypes.func,
    note: PropTypes.string.isRequired,
    lotNumber: PropTypes.string.isRequired,
    testCode: PropTypes.string,
    sequence: sequenceShape,
    labnotes: PropTypes.string,
    readOnly: PropTypes.bool.isRequired,
    submitText: PropTypes.string.isRequired,
    showSubmit: PropTypes.bool.isRequired,
    showReset: PropTypes.bool.isRequired,
    disabled: PropTypes.bool.isRequired,
    birthday: momentPropTypes.momentObj
  }

  static defaultProps = {
    onReset: null,
    onSubmit: null,
    note: 'POSVQA',
    lotNumber: '19017001',
    testCode: null,
    sequence: null,
    labnotes: '',
    readOnly: false,
    editableByDefault: true,
    submitText: 'Add patient',
    showSubmit: true,
    showReset: true,
    disabled: false,
    birthday: null
  }

  constructor() {
    super(...arguments);
    this.state = {invalid: false};
  }

  handlePropChange(propName) {
    const isSelect =
      ['testCode'].indexOf(propName) > -1;
    return value => {
      if (isSelect) {
        value = value ? (value.value || value.label) : null;
      }
      const props = {};
      props[propName] = value;
      this.props.onChange(props);
    };
  }

  handleSubmit(e) {
    const {
      note, lotNumber,
      testCode, onSubmit} = this.props;
    const messages = (
      checkRequired(note, true)
      .concat(checkRequired(lotNumber, true))
      .concat(this.validateSequence(true))
      .concat(checkRequired(testCode, true)));

    checkMessagesOnSubmit(
      messages, () => onSubmit(e),
      () => this.setState({invalid: true}));
    e.preventDefault();
  }

  handleReset() {
    const {onReset} = this.props;
    this.setState({invalid: false});
    onReset();
  }

  validateSequence(required = false) {
    const messages = [];
    const {sequence} = this.props;
    if (required) {
      if (!sequence) {
        messages.push({
          text: 'Sequence field is required.',
          level: 'error'
        });
      }
      else if (!sequence.sequence ||
               sequence.genes.length === 0 ||
               !sequence.subtype.name) {
        messages.push({
          text: 'The input sequence is not a valid HIV pol DNA sequence.',
          level: 'error'
        });
      }
    }
    return messages;
  }

  render() {
    const {invalid} = this.state;
    const {note, lotNumber, sequence, labnotes,
           testCode, showSubmit, showReset, submitText,
           readOnly, editableByDefault, disabled} = this.props;
    // hide deprecated test codes
    const _testCodeOptions = TEST_CODE_OPTIONS.filter(({deprecated}) => !deprecated);
    const _testCodeOption = TEST_CODE_OPTIONS.find(({value}) => value === testCode);
    if (_testCodeOption && _testCodeOption.deprecated) {
      _testCodeOptions.push(_testCodeOption);
    }

    return (
      <FormHorizental
       onReset={this.handleReset.bind(this)}
       onSubmit={this.handleSubmit.bind(this)}>
        <TextInput
         {...{editableByDefault, readOnly}}
         messages={checkRequired(note, invalid)}
         value={note} name="note"
         onChange={this.handlePropChange('note')} />
        <TextInput
         {...{editableByDefault, readOnly}}
         messages={checkRequired(lotNumber, invalid)}
         value={lotNumber} name="lotNumber"
         onChange={this.handlePropChange('lotNumber')} />
        <FormSelect
         {...{editableByDefault, readOnly}}
         name="testCode" value={testCode}
         messages={checkRequired(testCode, invalid)}
         onChange={this.handlePropChange('testCode')}
         options={_testCodeOptions} />
        <SequenceInput
         {...{editableByDefault, readOnly}}
         isAmplifiable={true}
         messages={this.validateSequence(invalid)}
         value={sequence} testCode={testCode}
         onChange={this.handlePropChange('sequence')} />
        <ReadOnlyInput name="genes" placeholder={<em>Need sequence</em>}>
          {sequence ? [
            sequence.genes.join(', '),
            testTestCode(testCode, sequence.genes) === false ?
              <span key={0} className={formStyle.warning}>
                <strong>mismatched test code</strong>
              </span> :
              null
          ] : ''}
        </ReadOnlyInput>
        <TextArea
         {...{editableByDefault, readOnly}}
         placeholder="Laboratory notes" minRows={3} maxRows={15}
         name="labnotes" label="Laboratory notes"
         value={labnotes} onChange={this.handlePropChange('labnotes')} />
        <FormButtons
         {...{submitText, showSubmit, showReset}}
         submitProps={{disabled}} resetProps={{disabled}} />
      </FormHorizental>);
  }

}
