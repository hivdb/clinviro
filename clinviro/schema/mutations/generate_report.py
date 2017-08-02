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

from datetime import datetime

import pytz
import graphene
from flask import current_app as app
from flask_login import login_required

from ..utils import get_numeric_id
from ..patient_sample import PatientSample
from ..proficiency_sample import ProficiencySample
from ..positive_control import PositiveControl

db = app.db
models = app.models


class GenerateReport(graphene.ClientIDMutation):

    class Input:
        type = graphene.Enum(
            'ReportType',
            [('patient_sample',) * 2,
             ('proficiency_sample',) * 2,
             ('positive_control',) * 2]
        )(required=True)
        uid = graphene.ID(required=True)
        is_regenerated_report = graphene.Boolean(required=True)

    patient_sample = graphene.Field(PatientSample)
    proficiency_sample = graphene.Field(ProficiencySample)
    positive_control = graphene.Field(PositiveControl)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, input_, context, info):
        rtype = input_['type']
        uid = get_numeric_id(input_['uid'])
        is_regenerated_report = input_['is_regenerated_report']
        if rtype == 'patient_sample':
            sample = models.PatientSample.query.get(uid)
        elif rtype == 'proficiency_sample':
            sample = models.ProficiencySample.query.get(uid)
        else:
            sample = models.PositiveControl.query.get(uid)

        if rtype != 'patient_sample' or sample.amplifiable:
            sierra_result = sample.sierra_result
            sample.sequence.subtype = sierra_result['subtype']
            sample.sequence.genes = sierra_result['genes']
            db.session.flush()
            sample.generate_reports(
                datetime.now(pytz.utc), is_regenerated_report)
        else:
            sample.generate_reports(
                datetime.now(pytz.utc),
                is_regenerated_report=is_regenerated_report)
        db.session.commit()
        return GenerateReport(
            patient_sample=(
                sample if rtype == 'patient_sample' else None
            ),
            proficiency_sample=(
                sample if rtype == 'proficiency_sample' else None
            ),
            positive_control=(
                sample if rtype == 'positive_control' else None
            )
        )
