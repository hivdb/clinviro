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

import React from 'react';
import Relay from 'react-relay/classic';

import PatientSampleInfobox from './patient-sample-infobox';
import PositiveControlInfobox from './positive-control-infobox';
import ProficiencySampleInfobox from './proficiency-sample-infobox';


class SimilarSequenceList extends React.Component {

  render() {
    const {viewer: {similarSequences}} = this.props;
    const size = similarSequences.length;

    if (size === 0) {
      return <div>
        Good news, no similar sequence was found.
      </div>;
    }

    let title = `I found ${size} similar sequence${size > 1 ? 's': ''}`;
    return <div>
      <p>{title}:</p>
      {similarSequences.map((node, idx) => {
        const distance = 100 - node.pident;
        if (node.type === 'patient_sample') {
          return <PatientSampleInfobox key={idx}
                  distance={distance}
                  {...node} />;
        }
        else if (node.type === 'positive_control') {
          return <PositiveControlInfobox key={idx}
                  distance={distance}
                  {...node} />;
        }
        else {
          return <ProficiencySampleInfobox key={idx}
                  distance={distance}
                  {...node} />;
        }
      })}
    </div>;
  }

}


export default Relay.createContainer(
  SimilarSequenceList,
  {
    initialVariables: {
      sequenceId: null,
      naseq: null,
      enteredBefore: null,
      removePositiveControls: null,
      ptnumExclude: null
    },
    fragments: {
      viewer: () => Relay.QL`
        fragment on Viewer {
          similarSequences(
            sequenceId: $sequenceId,
            naseq: $naseq,
            enteredBefore: $enteredBefore,
            removePositiveControls: $removePositiveControls,
            ptnumExclude: $ptnumExclude) {
            type
            patientSample {
              ${PatientSampleInfobox.getFragment('patientSample')}
            }
            positiveControl {
              ${PositiveControlInfobox.getFragment('positiveControl')}
            }
            proficiencySample {
              ${ProficiencySampleInfobox.getFragment('proficiencySample')}
            }
            pident
          }
        }
      `
    }
  }
);

