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
import Select from 'react-select';
import VirtualizedSelect from 'react-virtualized-select';
import humanize from 'underscore.string/humanize';
import underscored from 'underscore.string/underscored';

import FormGroup from './form-group';
import ValueViewer from './value-viewer';
import Messages, {messagesShape} from './messages';
import style from './style.css';
import 'react-select/dist/react-select.css';
import 'react-virtualized-select/styles.css';

export default class FormSelect extends React.Component {

  static propTypes = {
    options: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired
      }).isRequired
    ),
    allowCreate: PropTypes.bool,
    loadOptions: PropTypes.func,
    value: PropTypes.string,
    name: PropTypes.string.isRequired,
    label: PropTypes.string,
    editableByDefault: PropTypes.bool.isRequired,
    readOnly: PropTypes.bool.isRequired,
    onChange: PropTypes.func.isRequired,
    onCreate: PropTypes.func,
    messages: messagesShape.isRequired,
    promptTextCreator: PropTypes.func
  }

  static defaultProps = {
    messages: [],
    editableByDefault: true,
    readOnly: false
  }

  constructor() {
    super(...arguments);
    const {editableByDefault} = this.props;
    const editable = editableByDefault;
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

  handleChange(newValue) {
    const {onChange, onCreate, allowCreate} = this.props;
    if (!newValue) {
      return onChange(null);
    }
    const {value, cleanLabel} = newValue;
    if (allowCreate && value === '__new') {
      return onCreate({label: cleanLabel});
    }
    return onChange(newValue);
  }

  promptTextCreator(label) {
    const {label: labelName, promptTextCreator} = this.props;
    if (promptTextCreator) {
      return promptTextCreator(label);
    }
    return {
      label,
      prompt: `Create ${labelName.toLowerCase()} "${label}"`
    };
  }

  shouldKeyDownEventCreateNewOption({keyCode}) {
    if ([9 /*TAB*/, 13 /*ENTER*/, 188 /*,*/].indexOf(keyCode) > -1) {
      return false;
    }
  }

  newOptionCreator({label, labelKey, valueKey}) {
    const option = {};
    if (typeof label === 'object') {
      let {prompt} = label;
      label = label.label;
      option[labelKey] = prompt;
    }
    else {
      option[labelKey] = label;
    }
    option[valueKey] = '__new';
    option.cleanLabel = label;
    option.className = 'Select-create-option-placeholder';
    return option;
  }

  isValidNewOption({label}) {
    if (!label) {
      return false;
    }
    return true;
  }

  isOptionUnique({option, options, labelKey}) {
    return options
      .filter(existingOption => (
        existingOption[labelKey].toLowerCase() ===
        option[labelKey].toLowerCase()
      ))
      .length === 0;
  }

  render() {
    const {options, loadOptions, value, allowCreate,
           name, label, messages, readOnly, ...props} = this.props;
    const {editable, focus} = this.state;
    let SelectComponent = Select; // the component used in JSX
    let selectComponent = null; // the component passed to VirtualizedSelect
    if (loadOptions) {
      SelectComponent = Select.Async;
    }
    if (allowCreate) {
      SelectComponent = Select.Creatable;
    }
    if (loadOptions && allowCreate) {
      SelectComponent = Select.AsyncCreatable;
    }
    if (options && options.length > 100) {
      selectComponent = SelectComponent;
      SelectComponent = VirtualizedSelect;
    }
    const _name = underscored(name);

    return <FormGroup>
      <label htmlFor={_name}>{label ? label : humanize(name)}: </label>
      {editable ?
       <div className={style.inputWrapper}>
         <SelectComponent
          shouldKeyDownEventCreateNewOption={this.shouldKeyDownEventCreateNewOption.bind(this)}
          newOptionCreator={this.newOptionCreator.bind(this)}
          promptTextCreator={this.promptTextCreator.bind(this)}
          isValidNewOption={this.isValidNewOption.bind(this)}
          isOptionUnique={this.isOptionUnique.bind(this)}
          {...props}
          selectComponent={selectComponent}
          autofocus={focus}
          onBlur={this.handleBlur.bind(this)}
          name={_name}
          value={value}
          onChange={this.handleChange.bind(this)}
          loadOptions={loadOptions}
          options={options} />
       </div> :
       <ValueViewer
        readOnly={readOnly}
        makeEditable={this.makeEditable.bind(this)}>
         {(options.find(o => o.value === value) || {}).label}
       </ValueViewer>}
       {messages.length ? <Messages messages={messages} /> : null}
     </FormGroup>;
  }

}
