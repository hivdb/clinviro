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
import Relay from 'react-relay/classic';
import moment from 'moment';
import {isPatientChanged} from '../comparisons';
import {UpdatePatient, PreviewPatientReport} from '../../../mutations';
import PatientSampleEditForm from './index';
import propTypes from './prop-types';
import PreviewWindow from '../../../utils/preview-window';


async function getDRMs(sequences) {
  const response = await fetch('https://hivdb.stanford.edu/graphql', {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `
        query getDRMs($sequences: [UnalignedSequenceInput!]!) {
          viewer {
            sequenceAnalysis(sequences: $sequences) {
              inputSequence { header }
              DRMs: mutations(filterOptions: [DRM]) {
                gene { name }
                position
                AAs
                isInsertion
                isDeletion
              }
            }
          }
        }
      `,
      variables: { sequences }
    })
  });
  const json = await response.json();
  const data = json.data.viewer.sequenceAnalysis;
  const result = {};
  for (const {DRMs} of data) {
    for (const {
      gene: {name: gene}, position, AAs,
      isInsertion, isDeletion
    } of DRMs) {
      if (!(gene in result)) {
        result[gene] = {};
      }
      if (!(position in result[gene])) {
        result[gene][position] = new Set();
      }
      const targetSet = result[gene][position];
      if (isInsertion) {
        targetSet.add('_');
      }
      else if (isDeletion) {
        targetSet.add('-');
      }
      else {
        for (const AA of AAs) {
          targetSet.add(AA);
        }
      }
    }
  }
  return result;
}


function findAdditionalDRMs(prevDRMs, DRMs) {
  const addDRMs = [];
  for (const gene of Object.keys(prevDRMs)) {
    for (const position of Object.keys(prevDRMs[gene])) {
      const prevAAs = prevDRMs[gene][position];
      let addAAs = new Set();
      if (!DRMs[gene] || !DRMs[gene][position]) {
        addAAs = prevAAs;
      }
      else {
        const AAs = DRMs[gene][position];
        for (const AA of prevAAs) {
          if (!AAs.has(AA)) {
            addAAs.add(AA);
          }
        }
      }
      if (addAAs.size > 0) {
        const textAAs = Array.from(addAAs).join('');
        addDRMs.push({
          gene,
          text: `${gene}:${position}${textAAs}`
        });
      }
    }
  }
  return addDRMs;
}


async function getMutationComments(mutations) {
  const response = await fetch('https://hivdb.stanford.edu/graphql', {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `
        query getMutationComments($mutations: [String!]!) {
          viewer {
            mutationsAnalysis(mutations: $mutations) {
              drugResistance {
                gene { name }
                commentsByTypes {
                  mutationType
                  comments {
                    text
                    boundMutation { text }
                  }
                }
              }
            }
          }
        }
      `,
      variables: { mutations }
    })
  });
  const json = await response.json();
  return json.data.viewer.mutationsAnalysis.drugResistance;
}


class ExistingPatientSampleEditForm extends React.Component {

  static propTypes = Object.assign({
    allowManualApprovement: PropTypes.bool.isRequired,
    manuallyApproved: PropTypes.bool.isRequired
  }, propTypes)

  static defaultProps = {
    ptnum: null,
    patientEditableByDefault: false,
    patientReadOnly: false,
    editableByDefault: true,
    readOnly: false,
    disabled: false,
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
    allowManualApprovement: false,
    manuallyApproved: false,
    submitText: 'Submit',
    showReset: true,
    showPreview: true
  }

  constructor() {
    super(...arguments);
    this.state = this.initialState;
  }

  get initialState() {
    const {ptnum} = this.props;
    const {lastname, firstname, birthday, medicalRecords} = this.patient;
    return {
      invalid: false,
      ptnum,
      fullname: `${lastname}, ${firstname}`,
      lastname,
      firstname,
      birthday: birthday && moment(birthday),
      mridOptions: medicalRecords.map(({mrid}) => (
        {value: mrid, label: mrid})),
      prevDRMs: null,
      disabled: false
    };
  }

  get patient() {
    return this.props.viewer.patients.edges[0].node;
  }

  get existingCollectDate() {
    return (
      this.patient.visits.edges
      .reduce((map, {node: {id: visitId, collectedAt, samples}}) => {
        collectedAt = moment(collectedAt);
        map.set(collectedAt, samples.reduce(
          (acc, {id: sampleId, testCode, vnum}) => {
            acc[testCode] = {vnum, visitId, sampleId};
            return acc;
          },
          {}
        ));
        return map;
      }, new Map())
    );
  }

  isNewMRID(mrid) {
    if (mrid === null) {
      return false;
    }
    for (const {mrid: knownMRID} of this.patient.medicalRecords) {
      if (knownMRID === mrid) {
        return false;
      }
    }
    return true;
  }

  get isPatientChanged() {
    const {mrid} = this.props;
    const {lastname, firstname, birthday} = this.state;
    return this.isNewMRID(mrid) ||
      isPatientChanged({lastname, firstname, birthday}, this.initialState);
  }

  getPrevSequences({
    requiredGenes = new Set(['PR', 'RT', 'IN']),
    curReceivedAt = this.props.receivedAt
  }) {
    const result = [];
    for (const {node: visit} of this.patient.visits.edges) {
      const {collectedAt} = visit;
      for (const {vnum, amplifiable, sequence, receivedAt} of visit.samples) {
        if (!amplifiable) {
          continue;
        }
        if (curReceivedAt && !curReceivedAt.isAfter(receivedAt || collectedAt)) {
          continue;
        }
        let {naseq, genes} = sequence;
        if (!genes.some(gene => requiredGenes.has(gene))) {
          continue;
        }
        result.push({
          header: `${vnum}|${collectedAt}`,
          sequence: naseq
        });
      }
    }
    return result;
  }

  async getPrevDRMs(requiredGenes, curReceivedAt) {
    if (this.state.prevDRMs) {
      return this.state.prevDRMs;
    }
    else {
      const prevDRMs = getDRMs(
        this.getPrevSequences({requiredGenes, curReceivedAt})
      );
      this.setState(prevDRMs);
      return prevDRMs;
    }
  }

  async updateNotes({sequence: {header, sequence, genes}, curReceivedAt, forceUpdate = false}) {
    if (!forceUpdate && this.props.sampleId) {
      return;
    }
    const requiredGenes = new Set(genes);
    if (this.getPrevSequences({requiredGenes, curReceivedAt}).length === 0) {
      this.props.onChange({notes: ''});
      return;
    }
    const DRMs = await getDRMs([{header, sequence}]);
    const prevDRMs = await this.getPrevDRMs(requiredGenes, curReceivedAt);
    const lenDRMs = Object.values(DRMs).reduce((sum, geneDRMs) => {
      sum += Object.keys(geneDRMs).length;
      return sum;
    }, 0);
    const addDRMs = findAdditionalDRMs(prevDRMs, DRMs);
    let notes;
    if (addDRMs.length > 0) {
      notes = (
        'Additional drug-resistance mutations found in previous sequences ' +
        'but not in the current sequence:'
      );
      const geneDR = await getMutationComments(addDRMs.map(({text}) => text));
      for (const {gene: {name: gene}, commentsByTypes} of geneDR) {
        const typePrefix = {
          PR: 'PR ',
          RT: '',
          IN: 'IN '
        }[gene];
        for (const {mutationType, comments} of commentsByTypes) {
          if (comments.length === 0 || mutationType === 'Other') {
            continue;
          }
          const plural = comments.length > 1;
          notes += (
            `\n\n ${typePrefix}${mutationType} mutation${plural ? 's' : ''}:`
          );
          for (const {text, boundMutation: {text: mut}} of comments) {
            notes += `\n- ${mut}: ${text}`;
          }
        }
      }
    }
    else {
      let drClasses = [];
      for (const gene of genes) {
        if (gene === 'PR') {
          drClasses.push('PI');
        }
        else if (gene === 'RT') {
          drClasses.push('NRTI');
          drClasses.push('NNRTI');
        }
        else {
          drClasses.push('INSTI');
        }
      }
      if (drClasses.length > 1) {
        drClasses = drClasses.slice(0, -1).join(', ') +
          ' or ' + drClasses[drClasses.length - 1];
      }
      else {
        drClasses = drClasses[0];
      }
      notes = (
        `The previous sequence(s) had no${lenDRMs > 0 ? ' additional': ''} ` +
        'drug-resistance mutations.'
      );
    }
    this.props.onChange({notes});
  }

  handleChange({fullname, firstname, lastname, birthday, ...props}) {
    const {mrid, sequence, receivedAt} = props;
    if (typeof(mrid) !== 'undefined') {
      let {mridOptions} = this.initialState;
      if (typeof(mrid) === 'string' && this.isNewMRID(mrid)) {
        mridOptions = [{value: mrid, label: mrid}].concat(mridOptions);
      }
      this.setState({mridOptions});
    }
    if (fullname) {
      this.setState({fullname, lastname, firstname});
    }
    if (birthday) {
      this.setState({birthday});
    }
    if ((receivedAt && this.props.sequence) || sequence) {
      this.updateNotes({
        sequence: sequence || this.props.sequence,
        curReceivedAt: receivedAt
      });
    }
    this.props.onChange(props);
  }

  handleSubmit(e) {
    const {ptnum, mrid, onSubmit} = this.props;
    const {lastname, firstname, birthday} = this.state;
    this.setState({disabled: true});
    const onSuccess = () => onSubmit(e);
    if (this.isPatientChanged) {
      const {patient} = this;
      this.props.relay.commitUpdate(
        new UpdatePatient({
          ptnum, lastname, firstname, birthday,
          newMrids: this.isNewMRID(mrid) ? [mrid] : [],
          mergeMrids: [], patient
        }),
        {onSuccess}
      );
    } else {
      // no need to update patient
      onSubmit(e);
    }
  }

  handlePreview() {
    const previewWindow = new PreviewWindow();
    this.setState({disabled: true});
    const {lastname, firstname, birthday} = this.state;
    const {ptnum, mrid, collectedAt} = this.props;
    const {
      testCode, sequence, vnum, isAmplifiable, physicianId,
      clinicId, notes, labnotes, receivedAt
    } = this.props;
    const sample = {
      testCode, sequence, vnum, isAmplifiable, physicianId,
      clinicId, notes, labnotes, receivedAt
    };

    const onSuccess = response => {
      const blob = new Blob([response.previewPatientReport.data], {type : 'application/json'});
      const objectURL = URL.createObjectURL(blob);
      previewWindow.setLocation(
        `/quality-control-report?data_url=${encodeURIComponent(objectURL)}`,
        this.handleSubmit.bind(this)
      );
      this.setState({disabled: false});
    };
    this.props.relay.commitUpdate(
      new PreviewPatientReport({
        ptnum, lastname, firstname, birthday,
        mrid, collectedAt, sample
      }),
      {onSuccess}
    );
  }

  handleReset(e) {
    const {onReset} = this.props;
    this.setState(this.initialState);
    onReset(e);
  }

  render() {
    const {isPatientChanged, existingCollectDate} = this;
    const {fullname, birthday, mridOptions, disabled} = this.state;
    const {showReset, showPreview, allowManualApprovement, sequence, ...props} = this.props;

    return (
      <PatientSampleEditForm
        {...{
          ...props, sequence, disabled, existingCollectDate,
          fullname, birthday, mridOptions, allowManualApprovement
        }}
        onRefreshNotes={async () => await this.updateNotes({sequence, forceUpdate: true})}
        onChange={this.handleChange.bind(this)}
        showReset={isPatientChanged || showReset}
        showPreview={isPatientChanged || showPreview}
        onSubmit={this.handleSubmit.bind(this)}
        onReset={this.handleReset.bind(this)}
        onPreview={this.handlePreview.bind(this)} />
    );
  }

}

export default Relay.createContainer(
  ExistingPatientSampleEditForm,
  {
    initialVariables: {
      ptnum: null
    },
    fragments: {
      viewer: variables => Relay.QL`
        fragment on Viewer {
          ${PatientSampleEditForm.getFragment('viewer', {...variables})}
          patients(first: 1, ptnums: [$ptnum]) {
            edges {
              node {
                ${UpdatePatient.getFragment('patient')}
                id
                ptnum
                firstname
                lastname
                birthday
                medicalRecords { mrid }
                visits(first: 100) {
                  edges {
                    node {
                      id
                      collectedAt
                      samples {
                        id
                        vnum
                        testCode
                        amplifiable
                        receivedAt
                        sequence {
                          naseq
                          genes
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `
    }
  }
);
