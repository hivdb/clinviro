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
import moment from 'moment';
import Infobox from '../../fragments/infobox';
import {DATE_FORMAT, TEST_CODE_OPTIONS} from '../../../constants';
import {getSubtypeDesc} from '../../fragments/forms';
import style from '../style.css';


function validateSample({
  vnum, testCode, amplifiable, sequence,
  physicianId, clinicId, receivedAt}) {
  return !!(
    vnum && testCode && (
    amplifiable ? sequence &&
    sequence.sequence && sequence.genes.length > 0 &&
    sequence.subtype && sequence.subtype.name : true
    ) && physicianId && clinicId && receivedAt);
}


export default class SampleInfobox extends React.Component {

  static propTypes = {
    onSelect: PropTypes.func.isRequired,
    onRemove: PropTypes.func.isRequired
  }

  render() {
    const {
      onSelect, onRemove,
      sample: {
        testCode, sequence, receivedAt,
        vnum, amplifiable}} = this.props;
    const empty = <span className={style.trivia}>empty</span>;
    const emptySubtype = <span className={style.trivia}>
      {amplifiable ? 'empty' : 'unamplifiable'}</span>;
    const items = [{
      title: 'Accession',
      value: vnum || empty
    }, {
      title: 'Test code',
      value: (TEST_CODE_OPTIONS.find(({value}) => value === testCode) || {}).label || empty
    }, {
      title: 'Subtype',
      value: sequence ? getSubtypeDesc(sequence.subtype) : emptySubtype
    }, {
      title: 'Received on',
      value: receivedAt ? moment(receivedAt).format(DATE_FORMAT) : empty
    }];
    if (!validateSample(this.props.sample)) {
      items.push({
        value: <span className={style.warning}>
          <strong>!! Incomplete sample</strong>
        </span>
      });
    }
    const hoverTip = [
      <a href="#" key={0}
       onClick={onSelect}>select</a>
    ];
    //if (cookie.allowDangerous) { // TODO: check if globally set allowDangerous=true
    hoverTip.push(<span key={1}>&nbsp;·&nbsp;</span>);
    hoverTip.push(
      <a href="#" key={2} onClick={onRemove}>remove</a>);
    //}
    return (
      <Infobox
       onDoubleClick={onSelect}
       hoverTip={hoverTip}
       items={items} />
    );
  }

}
