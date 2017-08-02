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
import style from '../style.css';


export default class ResistanceDetailSection extends React.Component {

  render() {
    const {amplifiable, drug_resistance, previous_sequences} = this.props;

    if (!amplifiable) {
      return null;
    }
    return <div>
      {drug_resistance.map(({gene, comments, drug_class_results}, idx) => [
        comments ?
          <section key={`cmt-${idx}`} className={style.reportSection}>
            <h2>{gene} Comments</h2>
            {comments.length === 0 ?
              <div>There is no comment.</div> :
              <ul>
                {comments.map(({text}, idx) => <li key={idx}>{text}</li>)}
              </ul>
            }
          </section> : null,
        <section key={`mutscore-${idx}`} className={style.reportSection}>
          <h2>{gene} Mutation Scores</h2>
          {drug_class_results.map(({drug_class, drug_levels, mutation_scores}, idx) => (
            <table key={idx} className={style.borderedTable}>
              <thead>
                <tr>
                  <th>{drug_class.name}</th>
                  {drug_levels.map(({drug}, idx) => <th key={idx}>{drug.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {mutation_scores.map(({mutations, drug_scores}, idx) => (
                  <tr key={idx}>
                    <th>{mutations.join(' + ')}</th>
                    {drug_levels.map(({drug}, idx) => <td key={idx}>{drug_scores[drug.name]}</td>)}
                  </tr>
                ))}
                {mutation_scores.length !== 1 ?
                  <tr>
                    <th>Total</th>
                    {drug_levels.map(({drug}, idx) => (
                      <td key={idx}>
                        {mutation_scores.reduce((sum, {drug_scores}) => (
                          sum + drug_scores[drug.name]
                        ), 0)}
                      </td>
                    ))}
                  </tr>
                  : null}
              </tbody>
            </table>
          ))}
        </section>,
        previous_sequences[gene] ?
          <section key={`prevseq-${idx}`} className={style.reportSection}>
            <h2>Previous {gene} sequences from same person</h2>
            <table className={style.borderedTable}>
              <thead>
                <tr>
                  <th>Collected on</th>
                  <th>Entered on</th>
                  <th>Accession #</th>
                  <th>Distance %</th>
                  <th>Mutations</th>
                </tr>
              </thead>
              <tbody>
                {previous_sequences[gene].map((seq, idx) => (
                  <tr key={idx}>
                    <td>{seq.collected_at}</td>
                    <td>{seq.entered_at}</td>
                    <td>{seq.vnum}</td>
                    <td>{(seq.distance * 100).toFixed(2)}%</td>
                    <td>{seq.mutations}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section> : null
      ])}
    </div>;
  }


}
