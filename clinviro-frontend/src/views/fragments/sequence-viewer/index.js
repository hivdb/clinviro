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
import Dialog from '../dialog';

import style from './style.css';


async function getMutations(sequence) {
  const response = await fetch('https://hivdb.stanford.edu/graphql', {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `
        query getMutations($sequence: UnalignedSequenceInput!) {
          viewer {
            sequenceAnalysis(sequences: [$sequence]) {
              alignedGeneSequences {
                gene { name }
                mutations { shortText }
              }
            }
          }
        }
      `,
      variables: {
        sequence: { header: 'seq', sequence }
      }
    })
  });
  const json = await response.json();
  const {data} = json;
  return (
    data.viewer.sequenceAnalysis[0]
    .alignedGeneSequences.map(({gene, mutations}) => ({
      gene: gene.name,
      geneMuts: mutations.map(({shortText}) => shortText)
    }))
  );
}


export default class SequenceViewer extends React.Component {

  static propTypes = {
    onClose: PropTypes.func.isRequired,
    sequence: PropTypes.string
  }

  constructor() {
    super(...arguments);
    this.state = {mutations: []};
  }

  async componentDidMount() {
    const {sequence} = this.props;
    if (sequence) {
      const mutations = await getMutations(sequence);
      this.setState({mutations});
    }
  }

  async componentWillReceiveProps(nextProps) {
    const {sequence: oldSeq} = this.props;
    const {sequence} = nextProps;
    if (oldSeq === sequence) {
      return;
    }
    let mutations;
    if (sequence) {
      mutations = await getMutations(sequence);
    } else {
      mutations = [];
    }
    this.setState({mutations});
  }

  render() {
    const {mutations} = this.state;
    const {onClose} = this.props;

    return <Dialog onClose={onClose} width="42rem" closeOnBlur>
      <div className={style.viewerInner}>
        {mutations.map(({gene, geneMuts}, idx) => (
          <div key={idx}>
            {gene} Mutations: {geneMuts.join(', ') ||
                <span className={style.empty}>EMPTY</span>}
          </div>
        ))}
      </div>
    </Dialog>;
  }
}
