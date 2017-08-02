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
import GoArrowRight from 'react-icons/lib/go/arrow-right';
import GoArrowDown from 'react-icons/lib/go/arrow-down';
import FormButtons from './form-buttons';
import FormSelect from './select';
import ReadOnlyInput from './read-only-input';
import FormGroup from './form-group';
import ValueViewer from './value-viewer';
import style from './style.css';
import Button from '../button';
import Dialog from '../../fragments/dialog';
import Messages, {messagesShape} from './messages';


class MergeMRIDForm extends React.Component {

  static contextTypes = {
    closeDialog: PropTypes.func.isRequired
  }

  static propTypes = {
    onSubmit: PropTypes.func.isRequired,
    allMRIDs: PropTypes.arrayOf(
      PropTypes.string.isRequired
    ).isRequired,
    unmergeableMRIDs: PropTypes.arrayOf(
      PropTypes.string.isRequired
    ).isRequired,
    mridTo: PropTypes.string,
    mridFrom: PropTypes.string.isRequired
  }

  constructor() {
    super(...arguments);
    const {mridTo} = this.props;
    this.state = {mridTo};
  }

  get isChanged() {
    return this.state.mridTo !== this.props.mridTo;
  }

  handleChange(mrid) {
    this.setState({mridTo: mrid ? mrid.value : null});
  }

  handleSubmit(e) {
    const {onSubmit} = this.props;
    this.context.closeDialog();
    onSubmit(this.state.mridTo);
    e.preventDefault();
  }

  handleReset(e) {
    const {mridTo} = this.props;
    this.setState({mridTo});
    e.preventDefault();
  }

  render() {
    const {isChanged} = this;
    const {mridTo} = this.state;
    const {closeDialog} = this.context;
    let {allMRIDs, mridFrom, unmergeableMRIDs} = this.props;
    unmergeableMRIDs = new Set(unmergeableMRIDs);
    const mridOptions = allMRIDs.map(mrid => ({
      value: mrid,
      label: mrid,
      disabled: mrid === mridFrom || unmergeableMRIDs.has(mrid)
    }));

    return (
      <div>
        <h2>Merge MRNs</h2>
        <p>
          This medical record number is referred by at least one patient
          visit record. Therefore it can not be deleted but can only be
          merged into another MRN.
        </p>
        <p>
          Select the desired target MRN from the dropdown box below. Then
          click "Save" button to save your change. MRNs that are pending
          for merging operations are not selectable.
        </p>
        <p>
          This operation is not reversable once applied in the main form.
        </p>
        <ReadOnlyInput name="mridFrom" label="MRN" value={mridFrom} />
        <div className={style.arrowDown}>
          <GoArrowDown />
        </div>
        <FormSelect
         options={mridOptions}
         label="Merge to"
         name="mridTo"
         value={mridTo}
         onChange={this.handleChange.bind(this)} />
        <FormButtons
         submitText="Save"
         onSubmit={this.handleSubmit.bind(this)}
         onReset={this.handleReset.bind(this)}
         submitProps={{'data-mrid-input': true}}
         resetProps={{'data-mrid-input': true}}
         showSubmit={isChanged}
         showReset={isChanged}>
          {isChanged ? null :
           <Button type="button" onClick={closeDialog}>Close</Button>}
        </FormButtons>
      </div>);
  }
}


export default class MRIDInput extends React.Component {

  static propTypes = {
    value: PropTypes.arrayOf(
      PropTypes.string.isRequired
    ).isRequired,
    indelibleMRIDs: PropTypes.arrayOf(
      PropTypes.string.isRequired
    ).isRequired,
    mergedMRIDs: PropTypes.object.isRequired,
    activeValue: PropTypes.string.isRequired,
    editableByDefault: PropTypes.bool.isRequired,
    readOnly: PropTypes.bool.isRequired,
    onChange: PropTypes.func.isRequired,
    messages: messagesShape.isRequired
  }

  static defaultProps = {
    editableByDefault: true,
    readOnly: false,
    messages: [],
    indelibleMRIDs: [],
    value: []
  }

  constructor() {
    super(...arguments);
    const {editableByDefault: editable} = this.props;
    this.state = {
      currentMergingMRID: null, editable};
    this.blurListener = this.blurListener.bind(this);
  }

  get valueCount() {
    const {value, activeValue} = this.props;
    if (activeValue) {
      return value.length - 1;
    }
    return value.length;
  }

  blurListener(e) {
    if (this.state.editable) {
      let elem = e.target;
      let triggerBlur = true;
      while (elem && elem.tagName !== 'FORM' &&
             elem.tagName !== 'BODY') {
        if (elem.dataset && elem.dataset.mridInput) {
          triggerBlur = false;
          break;
        }
        elem = elem.parentElement;
      }
      if (triggerBlur) {
        this.handleBlur();
      }
    }
  }

  makeEditable() {
    this.setState({editable: true});
    setTimeout(() => {
      window.addEventListener('click', this.blurListener);
    });
  }

  handleBlur() {
    const {editableByDefault} = this.props;
    if (!editableByDefault) {
      this.setState({editable: false});
      window.removeEventListener('click', this.blurListener);
      this._addMRID();
    }
  }

  handleInputKeyPress(e) {
    if (e.key === 'Enter') {
      this.addMRID(e);
    }
  }

  handleInputChange(e) {
    let {valueCount} = this;
    let {value, onChange} = this.props;
    const activeMRID = e.currentTarget.value;
    const cleanedValue = activeMRID.trim();
    if (cleanedValue && value.indexOf(cleanedValue) === -1) {
      onChange({activeMRID, mrids: value.slice(0, valueCount).concat([cleanedValue])});
    } else {
      onChange({activeMRID, mrids: value.slice(0, valueCount)});
    }
  }

  addMRID(e) {
    e.preventDefault();
    this._addMRID();
  }

  _addMRID() {
    let {valueCount} = this;
    let {onChange, value, activeValue} = this.props;
    const cleanedValue = activeValue.trim();
    if (!cleanedValue || value.slice(0, valueCount).indexOf(cleanedValue) !== -1) {
      onChange({activeMRID: ''});
      return;
    }
    onChange({activeMRID: ''});
  }

  openDialog(mrid) {
    return e => {
      e.preventDefault();
      this.setState({currentMergingMRID: mrid});
    };
  }

  closeDialog() {
    this.setState({currentMergingMRID: null});
  }

  removeMRID(mrid) {
    return e => {
      e.preventDefault();
      let {value, onChange} = this.props;
      const idx = value.indexOf(mrid);
      if (!mrid || idx === -1) {
        return;
      }
      onChange({mrids: value.slice(0, idx).concat(value.slice(idx + 1))});
    };
  }

  mergeMRID(mrid) {
    return mridTo => {
      const {mergedMRIDs} = this.props;
      mergedMRIDs[mrid] = mridTo;
      this.props.onChange({mergedMRIDs});
    };
  }

  render() {
    const {valueCount} = this;
    let {value, indelibleMRIDs, activeValue,
         mergedMRIDs, messages, readOnly} = this.props;
    const {editable, currentMergingMRID} = this.state;
    if (activeValue.trim().length > 0) {
      value = value.slice(0, valueCount);
    }
    indelibleMRIDs = new Set(indelibleMRIDs);
    const readOnlyMRIDs = new Set(Object.keys(mergedMRIDs)
                                  .map(key => mergedMRIDs[key]));

    return (
      <FormGroup ref="formGroup">
        <label htmlFor="mrid">MRNs:</label>
        {editable ?
         <span className={style.multiple} data-mrid-input>
           {value.map((mrid, idx) => (
             <div key={idx} className={style.oneOfMultiple}>
               {mergedMRIDs[mrid] ? <span className={style.mergeFrom}>
                 {mrid}<GoArrowRight /></span> : mrid}
               {mergedMRIDs[mrid] ? <span className={style.mergeTo}>
                 {mergedMRIDs[mrid]}
               </span> : null}
               {readOnlyMRIDs.has(mrid) ? null :
                valueCount > 1 ?
                indelibleMRIDs.has(mrid) ?
                <a href="#" onClick={this.openDialog(mrid)}>
                  (merge to)</a> :
                <a
                 href="#" onClick={this.removeMRID(mrid)}
                 data-mrid-input>(remove)</a> : null}
                {currentMergingMRID === mrid ?
                 <Dialog
                  onClose={this.closeDialog.bind(this)}
                  width="42rem"
                  closeOnBlur={true}>
                  <MergeMRIDForm
                   unmergeableMRIDs={Object.keys(mergedMRIDs)}
                   allMRIDs={value} mridTo={mergedMRIDs[mrid] || null}
                   mridFrom={mrid} onSubmit={this.mergeMRID(mrid)} />
                 </Dialog> : null}
             </div>
           ))}
           <input
            ref="input" type="text" id="mrid"
            value={activeValue}
            onChange={this.handleInputChange.bind(this)}
            onKeyPress={this.handleInputKeyPress.bind(this)}
            name="mrid" placeholder="000000000000000" />
           <Button onClick={this.addMRID.bind(this)} type="button">+</Button>
         </span> :
         <ValueViewer
          readOnly={readOnly} data-mrid-input
          makeEditable={this.makeEditable.bind(this)}>
           <span className={style.multiple}>
             {value.map((mrid, idx) => (
               <div key={idx} className={style.oneOfMultiple}>
                 {mergedMRIDs[mrid] ? <span className={style.mergeFrom}>
                   {mrid}<GoArrowRight /></span> : mrid}
                 {mergedMRIDs[mrid] ? <span className={style.mergeTo}>
                   {mergedMRIDs[mrid]}
                 </span> : null}
               </div>
             ))}
           </span>
         </ValueViewer>}
        {messages.length ? <Messages messages={messages} /> : null}
      </FormGroup>
    );
  }
}
