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
import Button from '../button';
import style from './style.css';

export default class FileInput extends React.Component {

  static propTypes = {
    name: PropTypes.string.isRequired,
    accept: PropTypes.string,
    placeholder: PropTypes.string.isRequired,
    disabled: PropTypes.bool.isRequired,
    multiple: PropTypes.bool.isRequired,
    children: PropTypes.node.isRequired,
    hideSelected: PropTypes.bool.isRequired,
    fileName: PropTypes.string
  }

  static defaultProps = {
    placeholder: 'No file chosen',
    disabled: false,
    multiple: false,
    children: 'Choose File',
    fileName: '',
    hideSelected: false
  }

  constructor() {
    super(...arguments);
  }

  handleChange(e) {
    if (this.props.onChange) this.props.onChange(e.currentTarget.files);
  }

  render() {
    let {name, accept, placeholder, disabled, fileName,
         multiple, children, hideSelected} = this.props;
    fileName = fileName || '';
    return (
      <span className={style.fileInput}>
        <input
         ref="file"
         type="file"
         tabIndex="-1"
         name={name} value=""
         onChange={this.handleChange.bind(this)}
         accept={accept}
         disabled={disabled}
         multiple={multiple} />
        <Button
         disabled={disabled}
         onClick={() => this.refs.file.click()}
         name={`${name}_button`}>
          {children}
        </Button>
        {hideSelected ? null :
         <input
          type="text"
          tabIndex="-1"
          name={`${name}_filename`}
          size={Math.min(Math.max(fileName.length, 20), 120)}
          value={fileName}
          onMouseDown={(e) => {
            this.refs.file.click();
            e.preventDefault();
          }}
          onChange={() => {}}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={true} />}
      </span>
    );
  }
}
