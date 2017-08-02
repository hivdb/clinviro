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
import Relay from 'react-relay/classic';
import {Link} from 'react-router';
import momentPropTypes from 'react-moment-proptypes';
import FaRefresh from 'react-icons/lib/fa/refresh';
import {
  FormHorizental, FormButtons, FormSelect, CheckboxInput,
  SequenceInput, checkMessagesOnSubmit, testTestCode,
  getSubtypeDesc, DateInput, FullnameInput, TextArea,
  ClinicSelect, PhysicianSelect, TextInput, ReadOnlyInput,
  BirthdayInput, style as formStyle
} from '../../fragments/forms';
import {TEST_CODE_OPTIONS, DATE_FORMAT} from '../../../constants';
import {validateFullname, checkRequired} from '../validators';
import propTypes from './prop-types';
import style from './style.css';


const exampleVnum = `${moment().format('YY')}X-000VI0000`;

class PatientSampleEditForm extends React.Component {

  static propTypes = Object.assign({
    hasSimilarPatients: PropTypes.bool.isRequired,
    fullname: PropTypes.string.isRequired,
    birthday: momentPropTypes.momentObj,
    existingCollectDate: PropTypes.object.isRequired,
    allowManualApprovement: PropTypes.bool.isRequired,
    manuallyApproved: PropTypes.bool,
    mridOptions: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired
      }).isRequired
    ),
    onRefreshNotes: PropTypes.func.isRequired
  }, propTypes)

  static defaultProps = {
    ptnum: null,
    fullname: '',
    birthday: null,
    mridOptions: [],
    allowManualApprovement: false,
    patientEditableByDefault: false,
    patientReadOnly: false,
    hasSimilarPatients: false,
    editableByDefault: true,
    readOnly: false,
    mrid: null,
    collectedAt: null,
    vnum: '',
    testCode: null,
    isAmplifiable: true,
    sequence: null,
    physicianId: null,
    clinicId: null,
    receivedAt: null,
    notes: '',
    labnotes: '',
    submitText: 'Submit',
    showReset: true,
    showPreview: true,
    existingCollectDate: new Map(),
    disabled: false,
    onRefreshNotes: () => null
  }

  constructor() {
    super(...arguments);
    this.state = {invalid: false, refreshingNotes: false};
  }

  handleCollectDateChange(collectedAt) {
    let {receivedAt} = this.props;
    if (receivedAt && receivedAt.isBefore(collectedAt)) {
      receivedAt = null;
      this.props.onChange({receivedAt});
    }
    this.props.onChange({collectedAt});
  }

  handleNameChange({value, lastname, firstname}) {
    this.props.onChange({fullname: value, lastname, firstname});
  }

  handlePropChange(propName) {
    const isSelect =
      ['mrid', 'physicianId', 'clinicId', 'testCode'].indexOf(propName) > -1;
    return value => {
      if (isSelect) {
        value = value ? (value.value || value.label) : null;
      }
      const props = {};
      props[propName] = value;
      this.props.onChange(props);
    };
  }

  validateAndCallback(cb) {
    let messages = (
      this.validateDOB(true)
      .concat(this.validateCollectedAt(true))
      .concat(this.validateMRID(true))
      .concat(this.validateReceivedAt(true))
      .concat(this.validateVnum(true))
      .concat(this.validateTestCode(true))
      .concat(this.validatePhysicianId(true))
      .concat(this.validateClinicId(true))
      .concat(this.validateSequence(true))
    );

    checkMessagesOnSubmit(
      messages, cb,
      () => this.setState({invalid: true}));
  }

  handleSubmit(e) {
    const {onSubmit} = this.props;
    this.validateAndCallback(() => onSubmit(e));
    e && e.persist();
    e && e.preventDefault();
  }

  handlePreview(e) {
    const {onPreview} = this.props;
    this.validateAndCallback(() => onPreview(e));
    e && e.persist();
  }

  handleReset(e) {
    const {onReset} = this.props;
    this.setState({invalid: false});
    window.scroll(0, 0);
    onReset(e);
    e && e.persist();
  }

  validateFullname(required = false) {
    const {fullname, hasSimilarPatients} = this.props;
    const messages = validateFullname(fullname, required);
    if (hasSimilarPatients) {
      messages.push({
        text: <span>
          The program can not tell if the current patient is a
          duplicate of one of the patients listed in the right.
          Direct submission will result in the <strong>creation
          of a new patient record</strong>.
        </span>,
        level: 'warning'
      });
    }
    return messages;
  }

  validateDOB(required = false) {
    return checkRequired(this.props.birthday, required);
  }

  validateCollectedAt(required = false) {
    const {collectedAt} = this.props;
    return checkRequired(collectedAt, required);
  }

  validateMRID(required = false) {
    return checkRequired(this.props.mrid, required);
  }

  validateReceivedAt(required = false) {
    return checkRequired(this.props.receivedAt, required);
  }

  validateVnum(required = false) {
    return checkRequired(this.props.vnum, required);
  }

  validateTestCode(required = false) {
    const messages = [];
    const {ptnum, sampleId: selfId, collectedAt, testCode, existingCollectDate} = this.props;
    if (ptnum) {
      for (const date of existingCollectDate.keys()) {
        if (date.isSame(collectedAt)) {
          const availableTestCode = existingCollectDate.get(date);
          if (testCode in availableTestCode) {
            const {vnum, visitId, sampleId} = availableTestCode[testCode];
            if (sampleId === selfId) {
              break;
            }
            messages.push({
              text: <span>
                You are not able to input this record since an {testCode}{' '}
                sample "<strong><Link className={formStyle.inline} to={`/patients/patient-${ptnum}/visits/${visitId}/sample-${sampleId}`}>{vnum}</Link></strong>" which
                collected on {date.format(DATE_FORMAT)} for the same patient
                was already entered.
              </span>,
              level: 'error'
            });
            break;
          }
        }
      }
    }
    return messages.concat(checkRequired(this.props.testCode, required));
  }

  validatePhysicianId(required = false) {
    return checkRequired(this.props.physicianId, required);
  }

  validateClinicId(required = false) {
    return checkRequired(this.props.clinicId, required);
  }

  validateSequence(required = false) {
    const messages = [];
    const {sequence, isAmplifiable} = this.props;
    if (required && isAmplifiable) {
      if (!sequence) {
        messages.push({
          text: 'Sequence field is required for an amplifiable sample.',
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
  
  async handleRefreshNotes(e) {
    if (this.state.refreshingNotes) {
      return;
    }
    e && e.preventDefault();
    const text = (
      'Please confirm to regenerate the physician notes. ' +
      'Previous notes (if exists) will be replaced and lost ' +
      'if the change was submitted.');
    if (!confirm(text)) {
      return;
    }
    this.setState({refreshingNotes: true});
    await this.props.onRefreshNotes();
    this.setState({refreshingNotes: false});
  }

  render() {
    const {invalid, refreshingNotes} = this.state;
    const {
      viewer, fullname, birthday, mrid, mridOptions,
      patientEditableByDefault, ptnum, existingCollectDate,
      collectedAt, receivedAt, vnum, physicianId, clinicId,
      testCode, isAmplifiable, sequence, notes, labnotes,
      showReset, showPreview, submitText, readOnly,
      patientReadOnly, editableByDefault, disabled,
      allowManualApprovement, manuallyApproved
    } = this.props;

    // hide deprecated test codes
    const _testCodeOptions = TEST_CODE_OPTIONS.filter(({deprecated}) => !deprecated);
    const _testCodeOption = TEST_CODE_OPTIONS.find(({value}) => value === testCode);
    if (_testCodeOption && _testCodeOption.deprecated) {
      _testCodeOptions.push(_testCodeOption);
    }

    return (
      <FormHorizental
        invalid={invalid}
        onSubmit={this.handleSubmit.bind(this)}
        onReset={this.handleReset.bind(this)}>
        <FullnameInput
          onChange={this.handleNameChange.bind(this)}
          messages={this.validateFullname(invalid)} readOnly={patientReadOnly}
          value={fullname} editableByDefault={patientEditableByDefault} />
        <FormSelect
          name="mrid" label="MRN" allowCreate
          value={mrid} options={mridOptions}
          messages={this.validateMRID(invalid)} readOnly={readOnly}
          editableByDefault={editableByDefault}
          onCreate={this.handlePropChange('mrid')}
          onChange={this.handlePropChange('mrid')} />
        <BirthdayInput
          onChange={this.handlePropChange('birthday')}
          messages={this.validateDOB(invalid)} readOnly={!!birthday && patientReadOnly}
          value={birthday} editableByDefault={!birthday || patientEditableByDefault} />
        <DateInput
          {...{editableByDefault, readOnly}}
          name="collectedAt" label="Collected on" value={collectedAt}
          minDate={birthday} highlightDates={Array.from(existingCollectDate.keys())}
          messages={this.validateCollectedAt(invalid)}
          onChange={this.handleCollectDateChange.bind(this)} />
        <DateInput
          {...{editableByDefault, readOnly}}
          name="receivedAt" label="Received on" value={receivedAt}
          messages={this.validateReceivedAt(invalid)}
          minDate={collectedAt}
          onChange={this.handlePropChange('receivedAt')} />
        <TextInput
          {...{editableByDefault, readOnly}}
          placeholder={exampleVnum}
          messages={this.validateVnum(invalid)}
          name="vnum" label="Accession #" value={vnum}
          onChange={this.handlePropChange('vnum')} /> 
        <PhysicianSelect
          {...{editableByDefault, readOnly, ptnum}}
          messages={this.validatePhysicianId(invalid)}
          value={physicianId} viewer={viewer}
          onChange={this.handlePropChange('physicianId')} />
        <ClinicSelect
          {...{editableByDefault, readOnly, ptnum}}
          messages={this.validateClinicId(invalid)}
          value={clinicId} viewer={viewer}
          onChange={this.handlePropChange('clinicId')} />
        <FormSelect
          {...{editableByDefault, readOnly}}
          name="testCode" value={testCode}
          messages={this.validateTestCode(invalid)}
          onChange={this.handlePropChange('testCode')}
          options={_testCodeOptions} />
        <SequenceInput
          {...{editableByDefault, readOnly}}
          isAmplifiable={isAmplifiable}
          messages={this.validateSequence(invalid)}
          value={sequence} testCode={testCode}
          onAmplifiableChange={this.handlePropChange('isAmplifiable')}
          onChange={this.handlePropChange('sequence')} />
        {isAmplifiable ?
          <ReadOnlyInput name="genes" placeholder={<em>Need sequence</em>}>
            {sequence ? [
              sequence.genes.join(', '),
              testTestCode(testCode, sequence.genes) === false ?
                <span key={0} className={formStyle.warning}>
                  <strong>mismatched test code</strong>
                </span> :
                null
            ] : ''}
          </ReadOnlyInput> : null}
        {isAmplifiable ?
          <ReadOnlyInput
            name="subtype"
            value={sequence ? getSubtypeDesc(sequence.subtype) : ''}
            placeholder={<em>Need sequence</em>} /> : null}
        <TextArea
          {...{editableByDefault}}
          readOnly={readOnly || refreshingNotes}
          placeholder="Notes for physician" minRows={3} maxRows={15}
          name="notes" label={[
            'Notes for physician',
            !readOnly && existingCollectDate.size > 0 ? [
              ' (',
              <a
                title="Rerefresh physician notes"
                className={refreshingNotes ? style.spin : null}
                onClick={this.handleRefreshNotes.bind(this)} href="#">
                <FaRefresh />
                {refreshingNotes ? ' loading...' : null}
              </a>,
              ')'
            ] : null]}
          value={notes} onChange={this.handlePropChange('notes')} />
        <TextArea
          {...{editableByDefault, readOnly}}
          placeholder="Laboratory notes" minRows={3} maxRows={15}
          name="labnotes" label="Laboratory notes"
          value={labnotes} onChange={this.handlePropChange('labnotes')} />
        {allowManualApprovement ?
          <CheckboxInput
            checked={manuallyApproved}
            name="manuallyApproved"
            onChange={(e) => this.handlePropChange('manuallyApproved')(e.currentTarget.checked)}>
            Approve this sample manually
          </CheckboxInput> : null}
        <FormButtons
          onPreview={this.handlePreview.bind(this)}
          submitText={submitText} showSubmit={false}
          previewText="Preview & Submit"
          showReset={showReset} showPreview={showPreview}
          submitProps={{disabled}} resetProps={{disabled}}
          previewProps={{disabled, btnStyle: "primary"}} />
      </FormHorizental>);
  }

}

export default Relay.createContainer(
  PatientSampleEditForm,
  {
    initialVariables: {
      ptnum: null
    },
    fragments: {
      viewer: variables => Relay.QL`
        fragment on Viewer {
          ${ClinicSelect.getFragment('viewer', {...variables})}
          ${PhysicianSelect.getFragment('viewer', {...variables})}
        }
      `
    }
  }
);
