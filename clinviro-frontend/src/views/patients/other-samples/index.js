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
import SampleInfobox from './sample-infobox';
import InfoboxPlaceholder from '../../fragments/infobox/placeholder';


export default class OtherSamples extends React.Component {

  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  static propTypes = {
    ptnum: PropTypes.string.isRequired,
    visitId: PropTypes.string.isRequired,
    allowCreate: PropTypes.bool.isRequired
  }

  static defaultProps = {
    allowCreate: true
  }

  selectSample(sampleId) {
    const {ptnum, visitId} = this.props;
    return e => {
      e && e.preventDefault();
      this.context.router.push({
        pathname: `/patients/patient-${ptnum}/visits/${visitId}/sample-${sampleId}`
      });
    };
  }

  removeSample(/*sampleId*/) {
    return e => {
      e && e.preventDefault();
      alert('removed!');
      /*let {samples} = this;
      let {currentSampleIndex} = this.state;
      samples.splice(idx, 1);
      samples.reverse();
      if (currentSampleIndex >= samples.length) {
        currentSampleIndex = samples.length - 1;
        this.setState({currentSampleIndex});
      }
      else if (samples.length === 0) {
        this.setState({currentSampleIndex: 0});
      }
      this.props.onChange(samples);*/
    };
  }

  render() {
    let {ptnum, samples, allowCreate} = this.props;
    return <div>
      {allowCreate ? <InfoboxPlaceholder linkTo={`/patients/patient-${ptnum}/new-sample`}>
        Add new sample
      </InfoboxPlaceholder> : null}
      {samples.map((sample, idx) => (
        <SampleInfobox
         key={idx}
         onRemove={this.removeSample(sample.id)}
         onSelect={this.selectSample(sample.id)}
         sample={sample} />
      ))}
    </div>;
  }

}
