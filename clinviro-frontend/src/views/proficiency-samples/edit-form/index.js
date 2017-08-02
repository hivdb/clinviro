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
import {FormHorizental, FormButtons, TextInput, ReadOnlyInput, sequenceShape,
        SequenceInput, FormSelect, TextArea, DateInput, testTestCode,
        checkMessagesOnSubmit, style as formStyle} from '../../fragments/forms';
import {checkRequired} from '../validators';
import {TEST_CODE_OPTIONS} from '../../../constants';
import SourceSelect from '../source-select';


export default class ProficiencySampleEditForm extends React.Component {

  static propTypes = {
    onChange: PropTypes.func.isRequired,
    onSubmit: PropTypes.func,
    onPreview: PropTypes.func,
    onReset: PropTypes.func,
    name: PropTypes.string.isRequired,
    source: PropTypes.string,
    vnum: PropTypes.string.isRequired,
    testCode: PropTypes.string,
    sequence: sequenceShape,
    notes: PropTypes.string,
    labnotes: PropTypes.string,
    receivedAt: momentPropTypes.momentObj,
    readOnly: PropTypes.bool.isRequired,
    submitText: PropTypes.string.isRequired,
    showPreview: PropTypes.bool.isRequired,
    showReset: PropTypes.bool.isRequired,
    disabled: PropTypes.bool.isRequired,
    birthday: momentPropTypes.momentObj
  }

  static defaultProps = {
    onReset: null,
    onSubmit: null,
    name: '',
    source: null,
    vnum: '',
    testCode: null,
    sequence: null,
    notes: '',
    labnotes: '',
    receivedAt: null,
    readOnly: false,
    editableByDefault: true,
    submitText: 'Add patient',
    showPreview: true,
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
      name, source, vnum, receivedAt,
      testCode, onSubmit} = this.props;
    const messages = (
      checkRequired(name, true)
      .concat(checkRequired(source, true))
      .concat(checkRequired(vnum, true))
      .concat(this.validateSequence(true))
      .concat(checkRequired(receivedAt, true))
      .concat(checkRequired(testCode, true)));

    checkMessagesOnSubmit(
      messages, () => onSubmit(e),
      () => this.setState({invalid: true}));
    e && e.persist();
    e && e.preventDefault();
  }

  handlePreview(e) {
    const {onPreview} = this.props;
    this.setState({invalid: false});
    onPreview();
    e && e.persist();
  }

  handleReset(e) {
    const {onReset} = this.props;
    this.setState({invalid: false});
    onReset();
    e && e.persist();
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
    const {name, source, vnum, sequence, notes, labnotes, receivedAt,
           testCode, showPreview, showReset, submitText,
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
         messages={checkRequired(name, invalid)}
         value={name} name="name"
         onChange={this.handlePropChange('name')} />
        <SourceSelect
         {...{editableByDefault, readOnly}}
         messages={checkRequired(source, invalid)}
         value={source} name="source"
         onChange={this.handlePropChange('source')} />
        <TextInput
         {...{editableByDefault, readOnly}}
         messages={checkRequired(vnum, invalid)}
         value={vnum} name="vnum" label="Accession #"
         onChange={this.handlePropChange('vnum')} />
        <DateInput
         {...{editableByDefault, readOnly}}
         name="receivedAt" label="Received on" value={receivedAt}
         messages={checkRequired(receivedAt, invalid)}
         onChange={this.handlePropChange('receivedAt')} />
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
         placeholder="Notes" minRows={3} maxRows={15}
         name="notes" label="Notes"
         value={notes} onChange={this.handlePropChange('notes')} />
        <TextArea
         {...{editableByDefault, readOnly}}
         placeholder="Laboratory notes" minRows={3} maxRows={15}
         name="labnotes" label="Laboratory notes"
         value={labnotes} onChange={this.handlePropChange('labnotes')} />
        <FormButtons
         {...{submitText, showPreview, showReset}}
         showSubmit={false}
         previewText="Preview & Submit"
         onPreview={this.handlePreview.bind(this)}
         submitProps={{disabled}} resetProps={{disabled}}
         previewProps={{disabled, btnStyle: "primary"}} />
      </FormHorizental>);
  }

}
