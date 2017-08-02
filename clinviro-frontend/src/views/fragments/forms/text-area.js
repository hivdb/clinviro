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
import FormGroup from './form-group';
import ValueViewer from './value-viewer';
import humanize from 'underscore.string/humanize';
import underscored from 'underscore.string/underscored';
import Textarea from 'react-textarea-autosize';
import style from './style.css';

export default class TextArea extends React.Component {

  static propTypes = {
    name: PropTypes.string.isRequired,
    label: PropTypes.node,
    value: PropTypes.string.isRequired,
    readOnly: PropTypes.bool.isRequired,
    editableByDefault: PropTypes.bool.isRequired,
    onChange: PropTypes.func.isRequired
  }

  static defaultProps = {
    editableByDefault: true,
    readOnly: false,
    onChange: () => null,
    required: false,
    value: ''
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

  handleChange(e) {
    this.props.onChange(e.currentTarget.value);
  }

  handleBlur() {
    const {editableByDefault} = this.props;
    if (!editableByDefault) {
      this.setState({editable: false, focus: false});
    }
  }

  render() {
    const {name, label, value, readOnly, ...props} = this.props;
    const {editable, focus} = this.state;
    const _name = underscored(name);
    delete props.editableByDefault;

    return (
      <FormGroup>
        <label
          className={style.fullWidth}
          htmlFor={_name}>{label ? label : humanize(name)}: </label>
        <div className={style.fullWidth}>
          {editable ?
            <Textarea
              {...props}
              name={_name}
              onChange={this.handleChange.bind(this)}
              value={value} autoFocus={focus}
              onBlur={this.handleBlur.bind(this)} /> :
            <ValueViewer
              readOnly={readOnly}
              emptyText="(empty)"
              makeEditable={this.makeEditable.bind(this)}>
              {value}
            </ValueViewer>}
        </div>
      </FormGroup>
    );
  }

}
