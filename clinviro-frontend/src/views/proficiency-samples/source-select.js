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
import {FormSelect} from '../fragments/forms';
import {PROFICIENCY_SAMPLE_SOURCES} from '../../constants';


export default class SourceSelect extends React.Component {

  static propTypes = {
    onChange: PropTypes.func.isRequired,
    value: PropTypes.string
  }

  static defaultProps = {
    value: null
  }

  getOptions(value) {
    const options = (
      PROFICIENCY_SAMPLE_SOURCES
      .map(s => ({value: s, label: s}))
    );
    if (value && PROFICIENCY_SAMPLE_SOURCES.indexOf(value) === -1) {
      options.unshift({label: value, value});
    }
    return options;
  }

  handleChange(value) {
    value = value ? (value.value || value.label) : null;
    this.props.onChange(value);
  }

  promptTextCreator(label) {
    return { label, prompt: label };
  }

  render() {
    const {value, ...props} = this.props;
    const options = this.getOptions(value);
    delete props.onChange;
    return (
      <FormSelect
       allowCreate
       promptTextCreator={this.promptTextCreator.bind(this)}
       onChange={this.handleChange.bind(this)}
       onCreate={this.handleChange.bind(this)}
       {...{...props, options, value}} />
    );
  }
}
