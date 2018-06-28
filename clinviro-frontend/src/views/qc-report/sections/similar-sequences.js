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
import style from '../style.css';


class SimilarSequenceComparison extends React.Component {

  static propTypes = {
    title: PropTypes.string.isRequired,
    comparison: PropTypes.object.isRequired
  }

  render() {
    let {title, comparison} = this.props;
    comparison = Object.entries(comparison);
    if (comparison.every(([, cmplst]) => cmplst.length === 0)) {
      return null;
    }
    return <section>
      <h3>Comparison between sequence of {title} and current sequence:</h3>
      <table className={style.borderedTable}>
        <thead>
          <tr>
            <th>Codon</th>
            <th>Previous NA</th>
            <th>Previous AA</th>
            <th>Current NA</th>
            <th>Current AA</th>
          </tr>
        </thead>
        <tbody>
          {comparison.map(([gene, cmplst], i) => (
            cmplst.map((cmp, j) => (
              <tr key={`${i}-${j}`}>
                <td>
                  {j === 0 ? `${gene}: ` : null}
                  {cmp.position}
                </td>
                <td>{cmp.prev_codon}</td>
                <td>{cmp.prev_aa}</td>
                <td>{cmp.cur_codon}</td>
                <td>{cmp.cur_aa}</td>
              </tr>
            ))
          ))}
        </tbody>
      </table>
    </section>;
  }
}


export default class SimilarSequencesSection extends React.Component {

  render() {
    const {report_type, amplifiable, similar_sequences} = this.props;

    if (!amplifiable) {
      return null;
    }

    return (
      <section className={style.reportSection}>
        <h2>Similar Sequences</h2>
        {similar_sequences.length > 0 ? [
          <p key={0}>
            These are past sequences which were found &lt; 1.5% distance from
            current sample.{' '}
            {report_type === 'patient' ? 'Samples of the same patient are excluded.' : null}
            {report_type === 'posctl' ? 'To prevent overflooding of this report page, ' +
             'only the first 10 closest previous positive control is included.' : null}
          </p>,
          <table key={1} className={style.borderedTable}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Accession</th>
                {report_type === 'profsample' ? null : <th>Clinic</th>}
                <th>Received on</th>
                <th>Entered on</th>
                <th>Distance</th>
              </tr>
            </thead>
            <tbody>
              {similar_sequences.map((one, idx) => (
                <tr key={idx}>
                  {one.type === 'patient_sample' ? [
                    <td key={0}>
                      <strong>Patient:</strong> {one.name}<br />
                      <strong>MRN:</strong> {one.mrid}
                    </td>,
                    <td key={1}>{one.vnum}</td>,
                    report_type === 'profsample' ? null : <td key={2}>{one.clinic}</td>
                  ] : one.type === 'proficiency_sample' ? [
                    <td key={0}>
                      {one.source} {one.name}
                    </td>,
                    <td key={1}>{one.vnum}</td>,
                    report_type === 'profsample' ? null : <td key={2}>-</td>
                  ] : [
                    <td key={0}>
                      Pos {one.note} (#{one.lot_number})
                    </td>,
                    <td key={1}>-</td>,
                    report_type === 'profsample' ? null : <td key={2}>-</td>
                  ]}
                  <td>{one.received_at ? one.received_at : '-'}</td>
                  <td>{one.entered_at}</td>
                  <td>{one.distance.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>,
          similar_sequences.map(({codon_comparison, ...one}, idx) => (
            <SimilarSequenceComparison
              key={idx} comparison={codon_comparison}
              title={(
                one.type === 'patient_sample' ? `${one.name}` :
                  one.type === 'proficiency_sample' ? `${one.source} ${one.name}` :
                    `Pos ${one.note} (#${one.lot_number})`
              ) + ` on ${one.received_at || one.entered_at}`} />
          ))
        ]
          : <p>
            No similar sequence was found{' '}
            {report_type === 'patient' ? 'in a different person.' : '.'}
          </p>}
      </section>
    );
  }

}
