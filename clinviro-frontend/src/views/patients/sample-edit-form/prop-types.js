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
import momentPropTypes from 'react-moment-proptypes';
import {sequenceShape} from '../../fragments/forms';

export default {
  patientEditableByDefault: PropTypes.bool.isRequired,
  patientReadOnly: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func,
  onReset: PropTypes.func,
  onPreview: PropTypes.func,
  editableByDefault: PropTypes.bool.isRequired,
  readOnly: PropTypes.bool.isRequired,
  mrid: PropTypes.string,
  collectedAt: momentPropTypes.momentObj,
  vnum: PropTypes.string,
  testCode: PropTypes.string,
  isAmplifiable: PropTypes.bool,
  sequence: sequenceShape,
  physicianId: PropTypes.string,
  clinicId: PropTypes.string,
  receivedAt: momentPropTypes.momentObj,
  notes: PropTypes.string,
  labnotes: PropTypes.string,
  submitText: PropTypes.string.isRequired,
  showReset: PropTypes.bool.isRequired,
  showPreview: PropTypes.bool.isRequired,
  disabled: PropTypes.bool.isRequired
};
