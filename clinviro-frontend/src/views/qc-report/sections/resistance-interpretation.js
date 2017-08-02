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


export default class ResistanceInterpretationSection extends React.Component {

  render() {
    const {amplifiable, drug_resistance} = this.props;

    if (!amplifiable) {
      return null;
    }
    return <div>
      {drug_resistance.map(({gene, mutations, mutation_types, drug_class_results}, idx) => (
        <section key={idx} className={style.reportSection}>
          <h2>Drug Resistance Interpretation: {gene}</h2>
          <table className={style.keywordTable}>
            <tbody>
              {mutation_types.map(({label, name: typeName}, idx) => (
                <tr key={idx}>
                  <th>{label}:</th>
                  <td>
                    {mutations.some(({type}) => type === typeName) ?
                     mutations
                       .filter(({type}) => type === typeName)
                       .map(({text}) => text)
                       .join(', ') :
                     'None'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {drug_class_results.map(({drug_class, drug_levels}, idx) => (
            <section key={idx}>
              <h3>{drug_class.fullname}</h3>
              <table className={style.keywordTable}>
                <tbody>
                  {drug_levels.map(({drug, level_text}, idx) => (
                    <tr key={idx}>
                      <th>{drug.fullname} ({drug.name})</th>
                      <td>{level_text}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </section>
      ))}
    </div>;

  }


}
