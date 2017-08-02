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

export default class Footer extends React.Component {

  render() {
    const {test_code} = this.props;

    return <section>
      <p>
        The Genotypic Antiretroviral Resistance Test reports mutations in HIV-1 {test_code === 'AVRT' ? 'protease and RT' : test_code === 'AVIN' ? 'integrase' : 'protease, RT and/or integrase'}. Mutations are defined as differences from the wildtype consensus B reference sequence. The interpretation is based on published data in the scientific and medical literature linking mutations and combinations of mutations to phenotypic and clinical drug resistance. The report should be used in conjunction with a patient's clinical history (including past treatments) and with a solid understanding of the principles of antiretroviral treatment (https://www.aidsinfo.nih.gov/guidelines/). A more detailed description of the test interpretation, which includes the consensus B protease and RT sequence, all of the mutation scores, all of the mutation comments, and updates can be found on the Stanford HIV Drug Resistance Database <a href="https://hivdb.stanford.edu/page/release-notes/" target="_blank">https://hivdb.stanford.edu/page/release-notes/</a>.
      </p>
      <p>
        Laboratory test performed by Stanford Health Care Virology Laboratory at 3375 Hillview Avenue, Palo Alto, CA 94304. This test was validated and its performance characteristics determined by the Stanford Health Care Virology Laboratory. It has not been cleared or approved by the U.S. Food and Drug Administration. Such approval is not required for tests validated by the performing laboratory.
      </p>
    </section>;
  }

}
