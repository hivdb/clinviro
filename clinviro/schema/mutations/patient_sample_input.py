# ClinViro
# Copyright (C) 2017 Stanford HIVDB team.
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

import graphene
from graphene.types.datetime import Date
from flask import current_app as app

from ..enums import SpecimenType
from ..utils import get_numeric_id

db = app.db
models = app.models


class PatientSampleInput(graphene.InputObjectType):

    test_code = graphene.String(required=True)
    specimen_type = SpecimenType(required=True)
    sequence = graphene.String()
    filename = graphene.String()
    vnum = graphene.String(required=True)
    amplifiable = graphene.Boolean(required=True)

    physician_id = graphene.ID(required=True)
    clinic_id = graphene.ID(required=True)
    notes = graphene.String()
    labnotes = graphene.String()
    received_at = Date()


def sample_input_to_args(input_):
    return {
        'vnum': input_['vnum'],
        'test_code': input_['test_code'],
        'specimen_type': input_['specimen_type'],
        'physician': models.Physician.query.get(
            get_numeric_id(input_['physician_id'])),
        'clinic': models.Clinic.query.get(
            get_numeric_id(input_['clinic_id'])),
        'amplifiable': input_['amplifiable'],
        'received_at': input_['received_at'],
        'notes': input_['notes'],
        'labnotes': input_['labnotes']
    }
