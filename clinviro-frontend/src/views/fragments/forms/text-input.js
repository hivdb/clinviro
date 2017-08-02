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
import ReactDOM from 'react-dom';
import FormGroup from './form-group';
import escapeHtml from 'escape-html';
import ValueViewer from './value-viewer';
import humanize from 'underscore.string/humanize';
import underscored from 'underscore.string/underscored';
import Messages, {messagesShape} from './messages';
import {preventEnterSubmittingHandler} from './helpers';
import style from './style.css';

function moveCaretToEnd(el) {
  el.focus();
  const text = el.textContent;
  if (!text) {
    return;
  }
  const range = document.createRange();
  const sel = window.getSelection();
  range.setStart(el.childNodes[0], text.length);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}


class ContentEditable extends React.Component {

  static propTypes = {
    placeholder: PropTypes.string.isRequired,
    onBlur: PropTypes.func,
    onInput: PropTypes.func,
    onKeyPress: PropTypes.func,
    onKeyDown: PropTypes.func,
    onChange: PropTypes.func.isRequired,
    value: PropTypes.string.isRequired
  }

  handleInput(e) {
    const {onChange, onInput} = this.props;
    const el = this.getDOMNode();
    if (onInput) {
      onInput(e);
    }
    onChange(el.textContent);
  }

  handleKeyDown(e) {
    const {onKeyDown} = this.props;
    const {anchorOffset} = window.getSelection();
    if (e.key === 'Enter' ||
        (anchorOffset === 0 && e.key === ' ')) {
      e.preventDefault();
      return;
    }
    onKeyDown(e);
  }

  shouldComponentUpdate(nextProps) {
    return nextProps.value !== this.getDOMNode().textContent;
  }

  componentDidUpdate() {
    const {value} = this.props;
    const el = this.getDOMNode();
    if (value !== el.textContent) {
      el.innerHTML = escapeHtml(value || '');
    }
  }

  getDOMNode() {
    return ReactDOM.findDOMNode(this);
  }

  focus() {
    return this.getDOMNode().focus();
  }

  render() {
    const {value, placeholder, id, name, onBlur, onKeyPress} = this.props;
    return (
      <span
       {...{value, placeholder, id, name, onBlur, onKeyPress}}
       contentEditable
       onInput={this.handleInput.bind(this)}
       onKeyDown={this.handleKeyDown.bind(this)}
       dangerouslySetInnerHTML={{__html: escapeHtml(value || '')}} />
    );
  }


}


export default class TextInput extends React.Component {

  static propTypes = {
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    placeholder: PropTypes.oneOfType([
      PropTypes.string.isRequired,
      PropTypes.arrayOf(
        PropTypes.string.isRequired
      ).isRequired
    ]).isRequired,
    delimiter: PropTypes.string,
    label: PropTypes.string,
    value: PropTypes.string.isRequired,
    readOnly: PropTypes.bool.isRequired,
    editableByDefault: PropTypes.bool.isRequired,
    onChange: PropTypes.func.isRequired,
    messages: messagesShape.isRequired,
    preventEnterSubmitting: PropTypes.bool.isRequired
  }

  static defaultProps = {
    type: 'text',
    editableByDefault: true,
    readOnly: false,
    onChange: () => null,
    required: false,
    messages: [],
    placeholder: '',
    value: '',
    preventEnterSubmitting: true
  }

  constructor() {
    super(...arguments);
    this.state = this.getStateFromProps(this.props);
  }

  getStateFromProps(props, changeEditable = true) {
    const {value, editableByDefault, delimiter,
           readOnly, placeholder} = props;
    let editable = (changeEditable ?
      editableByDefault : this.state.editable) && !readOnly;
    if (!readOnly && editableByDefault) {
      editable = true;
    }
    let values = null;
    if (typeof placeholder !== 'string') {
      values = Array(placeholder.length).fill('');
      if (delimiter && value) {
        values = value.split(delimiter);
      }
    }
    return {editable, focus: false, values};
  }

  componentWillReceiveProps(nextProps) {
    this.setState(this.getStateFromProps(nextProps, false));
  }

  get hasMultiFields() {
    const {placeholder} = this.props;
    return typeof placeholder !== 'string';
  }

  makeEditable() {
    this.setState({editable: true, focus: true});
    if (this.hasMultiFields) {
      setTimeout(() => this.refs.editable0.focus());
    }
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

  handleMultiFieldsContainerFocus(e) {
    if (e.target === this.refs.multiFieldsContainer) {
      this.refs.editable0.focus();
    }
  }

  handleMultiFieldsBlur(e) {
    const {editableByDefault} = this.props;
    if (editableByDefault) {
      return;
    }
    e.stopPropagation();
    setTimeout(() => {
      const curEl = document.activeElement;
      const container = this.refs.multiFieldsContainer;
      if (curEl !== container &&
          curEl.parentElement !== container) {
        this.setState({editable: false, focus: false});
      }
    });
  }

  handleMultiFieldsChange(curIndex) {
    return curValue => {
      const {placeholder, delimiter} = this.props;
      const {values: origValues} = this.state;
      let values = [];
      let pasteText = [];
      for (const idx in placeholder) {
        let text;
        if (idx == curIndex) {
          text = curValue;
        }
        else {
          text = origValues[idx] || '';
        }
        if (idx > 0 && pasteText.length > 0) {
          if (text) {
            pasteText = [];
          } else {
            text = pasteText.shift().trim();
          }
        } else {
          pasteText = text.split(delimiter[0]);
          text = pasteText.shift();
        }
        values.push(text);
      }
      this.setState({values});
      this.props.onChange(values.join(delimiter));
    };
  }

  handleMultiFieldsKeyPress(index) {
    const {placeholder, delimiter} = this.props;
    return e => {
      if (delimiter.startsWith(e.key)) {
        e.preventDefault();
        if (index === placeholder.length - 1) {
          return;
        }
        this.refs[`editable${index + 1}`].focus();
      }
    };
  }

  handleMultiFieldsContainerClick(e) {
    if (e.target === e.currentTarget) {
      const {placeholder} = this.props;
      this.refs[`editable${placeholder.length - 1}`].focus();
    }
  }

  handleMultiFieldsKeyDown(index) {
    return e => {
      let targetEl;
      const {placeholder} = this.props;
      const fieldCount = placeholder.length;
      const curEl = e.currentTarget;
      const {anchorOffset} = window.getSelection();
      if (index < fieldCount - 1) {
        switch (e.key) {
        case 'ArrowRight':
          if (anchorOffset === curEl.textContent.length) {
            this.refs[`editable${index + 1}`].focus();
            e.preventDefault();
            return;
          }
          break;
        case 'End':
          targetEl = this.refs[`editable${fieldCount - 1}`].getDOMNode();
          moveCaretToEnd(targetEl);
          return;
        }
      }
      else if (index > 0) {
        switch (e.key) {
        case 'ArrowLeft':
          if (anchorOffset === 0) {
            const prevEl = this.refs[`editable${index - 1}`].getDOMNode();
            moveCaretToEnd(prevEl);
            e.preventDefault();
            return;
          }
          break;
        case 'Home':
          this.refs.editable0.focus();
          return;
        }
      }
      if (index === fieldCount - 1) {
        if (curEl.textContent.length > 0) {
          return;
        }
        if (e.key === 'Backspace') {
          targetEl = this.refs[`editable${index - 1}`].getDOMNode();
          moveCaretToEnd(targetEl);

          // don't delete the last char of prevEl
          e.preventDefault();
        }
      }
    };
  }

  render() {
    const {
      name, label, value, messages, type, preventEnterSubmitting,
      readOnly, placeholder, delimiter, ...props} = this.props;
    const {editable, focus, values} = this.state;
    const _name = underscored(name);
    delete props.editableByDefault;

    return (
      <FormGroup>
        <label htmlFor={_name}>{label ? label : humanize(name)}: </label>
        {editable ?
         this.hasMultiFields ?
         <div
          tabIndex="0"
          ref="multiFieldsContainer"
          onFocus={this.handleMultiFieldsContainerFocus.bind(this)}
          onClick={this.handleMultiFieldsContainerClick.bind(this)}
          className={style.joinInput}>
           {placeholder.map((ph, idx) => {
             const isEnd = placeholder.length === idx + 1;
             return [
               <ContentEditable
                key={idx}
                ref={`editable${idx}`}
                placeholder={ph}
                value={values[idx] || ''}
                onBlur={this.handleMultiFieldsBlur.bind(this)}
                onChange={this.handleMultiFieldsChange(idx)}
                onKeyPress={this.handleMultiFieldsKeyPress(idx)}
                onKeyDown={this.handleMultiFieldsKeyDown(idx)}
                name={`${_name}${idx}`} />,
               isEnd ? null : <span key={`join${idx}`}>{delimiter}</span>
             ];
           })}
         </div> :
         <input
          {...props}
          {...{placeholder, type, value}}
          name={_name}
          onChange={this.handleChange.bind(this)}
          onKeyPress={preventEnterSubmitting ? preventEnterSubmittingHandler : null}
          autoFocus={focus} onBlur={this.handleBlur.bind(this)} /> :
         <ValueViewer
          readOnly={readOnly}
          makeEditable={this.makeEditable.bind(this)}>
           {value}
         </ValueViewer>}
        {messages.length ? <Messages messages={messages} /> : null}
      </FormGroup>
    );
  }

}
