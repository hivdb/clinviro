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
import Button from '../button';


export default class FormButtons extends React.Component {

  static propTypes = {
    onSubmit: PropTypes.func.isRequired,
    onReset: PropTypes.func.isRequired,
    onPreview: PropTypes.func.isRequired,
    submitText: PropTypes.string.isRequired,
    resetText: PropTypes.string.isRequired,
    previewText: PropTypes.string.isRequired,
    showSubmit: PropTypes.bool.isRequired,
    showReset: PropTypes.bool.isRequired,
    showPreview: PropTypes.bool.isRequired,
    submitProps: PropTypes.object.isRequired,
    resetProps: PropTypes.object.isRequired,
    children: PropTypes.node
  }

  static defaultProps = {
    onSubmit: () => null,
    onReset: () => null,
    onPreview: () => null,
    submitText: 'Submit',
    submitProps: {},
    resetProps: {},
    resetText: 'Reset',
    previewText: 'Preview',
    showSubmit: true,
    showReset: true,
    showPreview: false
  }

  render() {
    const {onSubmit, onReset, onPreview, showSubmit, children,
           showReset, showPreview, submitText, resetText, previewText,
           submitProps, previewProps, resetProps} = this.props;
    return <FormGroup>
      <br />
      {showSubmit ?
       <Button
        type="submit" btnStyle="primary"
        onClick={onSubmit} {...submitProps}>
         {submitText}
       </Button> : null}
      {showPreview ?
       <Button
        type="button" onClick={onPreview} {...previewProps}>
        {previewText}
       </Button> : null}
      {showReset ?
       <Button
        type="reset" onClick={onReset} {...resetProps}>
        {resetText}
       </Button> : null}
      {children}
    </FormGroup>;
  }

}
