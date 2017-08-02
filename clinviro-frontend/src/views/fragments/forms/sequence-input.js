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
import classNames from 'classnames';
import Button from '../button';
import Dialog from '../dialog';
import readFile from '../../../utils/read-file';
import {parseFasta, concatFasta} from '../../../utils/fasta';

import FormGroup from './form-group';
import FormButtons from './form-buttons';
import FileInput from './file-input';
import CheckboxInput from './checkbox-input';
import Messages, {messagesShape, messagesHaveLevel} from './messages';
import style from './style.css';


export const sequenceShape = PropTypes.shape({
  header: PropTypes.string.isRequired,
  sequence: PropTypes.string.isRequired,
  genes: PropTypes.arrayOf(
    PropTypes.string.isRequired
  ),
  subtype: PropTypes.shape({
    name: PropTypes.string.isRequired,
    distancePcnt: PropTypes.number
  }),
  fileName: PropTypes.string
});


async function getSequenceMeta(header, sequence) {
  const response = await fetch('https://hivdb.stanford.edu/graphql', {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `
        query getSequenceMeta($sequence: UnalignedSequenceInput!) {
          viewer {
            sequenceAnalysis(sequences: [$sequence]) {
              availableGenes { name }
              bestMatchingGenotype {
                name: displayWithoutDistance,
                distancePcnt
              }
            }
          }
        }
      `,
      variables: {
        sequence: { header, sequence }
      }
    })
  });
  const json = await response.json();
  const {data} = json;
  const genes = (
    data.viewer.sequenceAnalysis[0]
    .availableGenes.map(({name}) => name)
  );
  const subtype = (
    data.viewer.sequenceAnalysis[0]
    .bestMatchingGenotype
  );
  return {genes, subtype};
}

export function getSubtypeDesc({name, distancePcnt}) {
  if (distancePcnt) {
    return `${name} (${distancePcnt})`;
  } else {
    return name;
  }
}

export function testTestCode(testCode, genes) {
  if (!genes || genes.length === 0) {
    return null;
  }
  if (testCode === 'AVRT') {
    return genes.join('') === 'PRRT';
  }
  else if (testCode === 'AVIN') {
    return genes.join('') === 'IN';
  }
  return null;
}


class SequenceForm extends React.Component {

  static propTypes = {
    sequence: sequenceShape,
    testCode: PropTypes.string,
    readOnly: PropTypes.bool.isRequired,
    onChange: PropTypes.func.isRequired
  }

  static contextTypes = {
    closeDialog: PropTypes.func.isRequired
  }

  constructor() {
    super(...arguments);
    this.state = this.initialState;
    this._delayTimeout = null;
  }

  get initialState() {
    if (!this.props.sequence) {
      return {
        value: '',
        genes: [],
        ready: false,
        invalid: false,
        subtype: null
      };
    }
    const {header, sequence, genes, subtype, fileName} = this.props.sequence;
    return {
      value: concatFasta(header, sequence), fileName,
      genes, subtype, ready: false, invalid: false
    };
  }

  get isChanged() {
    return (
      (this.state.value !== this.initialState.value) &&
      this.sequences.length > 0 && this.sequences[0].sequence.length > 0
    );
  }

  handleReset(e) {
    this.setState(this.initialState);
    e.preventDefault();
  }

  prepareSequence() {
    const [{header, sequence}] = this.sequences;
    const {genes, subtype, fileName} = this.state;
    return {header, sequence, genes, subtype, fileName};
  }

  handleSubmit(hasWarnings = false) {
    const cb = (e) => {
      this.submit();
      e.preventDefault();
    };
    if (hasWarnings) {
      return (e) => {
        if (confirm("There are unsolved warning messages. " +
                    "Please confirm to ignore them.")) {
          cb(e);
        }
      };
    }
    return cb;
  }

  submit() {
    const {onChange} = this.props;
    const {closeDialog} = this.context;
    onChange(this.prepareSequence());
    closeDialog();
  }

  async setValue(value, autoSubmit = false, delay = false) {
    this.setState({
      value, genes: [], subtype: null,
      ready: false, invalid: false
    });
    const cb = async () => {
      const [seqobj] = this.sequences;
      if (!seqobj) {
        return;
      }
      const {header, sequence} = seqobj;
      if (!sequence) {
        return;
      }
      const {genes, subtype} = await getSequenceMeta(header, sequence);
      this.setState({
        genes, subtype, ready: true,
        invalid: genes.length === 0
      });
      if (autoSubmit) {
        setTimeout(() => {
          const hasWarnings = messagesHaveLevel(this.validate(), 'warning');
          if (!hasWarnings) {
            this.submit();
          }
        });
      }
    };
    if (delay) {
      if (this._delayTimeout) {
        clearTimeout(this._delayTimeout);
      }
      this._delayTimeout = setTimeout(cb, 1000);
    }
    else {
      return cb();
    }
  }

  async componentDidMount() {
    const {value, genes, subtype} = this.state;
    if (value && (genes.length === 0 || !subtype ||
                  subtype.name === '-' || !subtype.distancePcnt)) {
      await this.setValue(this.state.value);
      const {onChange} = this.props;
      onChange(this.prepareSequence());
    }
  }

  async handleFileInputChange([file]) {
    if (!file || !(/^text\/.+$|^$/.test(file.type))) {
      return;
    }
    this.setState({fileName: file.name});
    this.setValue(await readFile(file), true);
  }

  handleTextAreaChange(e) {
    const value = e.currentTarget.value;
    this.setValue(value, false, true);
  }

  get sequences() {
    const {value} = this.state;
    return parseFasta(value);
  }

  validate() {
    const {testCode} = this.props;
    const {genes, subtype, invalid} = this.state;
    const {sequences} = this;
    let messages = [];
    if (sequences.length > 1) {
      messages.push({
        text: ('More than one sequences were found. ' +
               'Only the first sequence will be uploaded.'),
        level: 'warning'
      });
    }
    if (testTestCode(testCode, genes) === false) {
      messages.push({
        text: <span>
          Input sequence doesn't match current selected
          test code <strong>{testCode}</strong>.
        </span>,
        level: 'warning'
      });
    }
    if (invalid) {
      messages.push({
        text: 'Invalid sequence detected.',
        level: 'error'
      });
    }
    if (genes.length > 0) {
      messages.push({
        text: `Gene(s): ${genes.join(', ')}`,
        level: 'info'
      });
    }
    if (subtype) {
      messages.push({
        text: `Subtype: ${getSubtypeDesc(subtype)}`,
        level: 'info'
      });
    }
    return messages;
  }

  render() {
    const {readOnly} = this.props;
    const {value, ready, invalid, fileName} = this.state;
    const {isChanged} = this;
    const {closeDialog} = this.context;
    const messages = this.validate();

    return <div className={style.sequenceForm}>
      <p>Choose FASTA file or paste sequence here.</p>
      <FormGroup>
        <FileInput
          onChange={this.handleFileInputChange.bind(this)}
          fileName={fileName} disabled={readOnly}
          accept="text/plain,text/x-fasta,.fasta,.fas,.fna"
          name="upload" />
      </FormGroup>
      <FormGroup>
        <textarea
          rows="7" disabled={readOnly}
          onChange={this.handleTextAreaChange.bind(this)}
          name="sequence" value={value} />
      </FormGroup>
      <Messages messages={messages} />
      <FormButtons
        showSubmit={!readOnly && isChanged && ready && !invalid}
        onSubmit={this.handleSubmit(messagesHaveLevel(messages, 'warning'))}
        submitText="Upload"
        showReset={isChanged}
        onReset={this.handleReset.bind(this)}>
        {isChanged ? null :
          <Button type="button" onClick={closeDialog}>Close</Button>}
      </FormButtons>
    </div>;
  }

}


export default class SequenceInput extends React.Component {

  static propTypes = {
    value: sequenceShape,
    isAmplifiable: PropTypes.bool,
    testCode: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    messages: messagesShape.isRequired,
    readOnly: PropTypes.bool.isRequired,
    onAmplifiableChange: PropTypes.func.isRequired
  }

  static defaultProps = {
    readOnly: false,
    onAmplifiableChange: () => null,
    messages: []
  }

  constructor() {
    super(...arguments);
    this.state = {showDialog: false};
  }

  openDialog() {
    this.setState({showDialog: true});
  }

  closeDialog() {
    this.setState({showDialog: false});
  }

  handleUnamplifiableChange(e) {
    const {onAmplifiableChange} = this.props;
    onAmplifiableChange(!e.currentTarget.checked);
  }

  handleChange(value) {
    const {onChange, onAmplifiableChange} = this.props;
    onAmplifiableChange(true);
    onChange(value);
  }

  clearSequence(e) {
    const {readOnly} = this.props;
    e.preventDefault();
    if (!readOnly) {
      this.props.onChange(null);
    }
  }

  render() {
    const {value, testCode, readOnly, isAmplifiable, messages} = this.props;
    const {showDialog} = this.state;

    return (
      <FormGroup>
        <label htmlFor="sequence">Sequence:</label>
        <div className={style.inputWrapper}>
          <Button
            type="button"
            onClick={this.openDialog.bind(this)}>
            {readOnly ? 'Detail' : 'Upload'}...
          </Button>
          {value ?
            <span className={classNames(
              style.inlineValueViewer,
              style.pullRight, style.readOnly)}>
              {value.fileName || 'Untitled sequence'}
              &nbsp;{readOnly ? null : <a href="#" onClick={this.clearSequence.bind(this)}
                title="clear sequence">(×)</a>}
            </span> :
            <CheckboxInput
              className={style.pullRight} name="unamplifiable"
              checked={!isAmplifiable} disabled={readOnly}
              onChange={this.handleUnamplifiableChange.bind(this)} />
          }
          {showDialog ?
            <Dialog
              onClose={this.closeDialog.bind(this)}
              closeOnBlur={false}>
              <SequenceForm
                sequence={value}
                {...{readOnly, testCode}}
                onChange={this.handleChange.bind(this)} />
            </Dialog> : null}
        </div>
        {messages.length ? <Messages messages={messages} /> : null}
      </FormGroup>
    );

  }

}
