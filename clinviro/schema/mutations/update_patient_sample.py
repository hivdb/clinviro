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
from graphene.types.datetime import DateTime
from flask_login import login_required
from flask import current_app as app

from ..utils import get_numeric_id
from ..patient import Patient
from ..patient_sample import PatientSample
from ..patient_visit import PatientVisit

from .patient_sample_input import PatientSampleInput, sample_input_to_args

db = app.db
models = app.models


class UpdatePatientSample(graphene.ClientIDMutation):

    class Input:
        id = graphene.ID(required=True)
        mrid = graphene.String()
        collected_at = DateTime()
        sample = PatientSampleInput(required=True)
        manually_approved = graphene.Boolean()

    patient = graphene.Field(Patient)
    updated_patient_visit = graphene.Field(PatientVisit)
    updated_patient_sample = graphene.Field(PatientSample)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, input_, context, info):
        sample = models.PatientSample.query.get(get_numeric_id(input_['id']))
        visit = sample.visit
        if 'mrid' in input_:
            visit.mrid = input_['mrid']
        if 'collected_at' in input_:
            visit.collected_at = input_['collected_at'].date()

        # update sample
        sample_input = input_['sample']
        sample_args = sample_input_to_args(sample_input)
        for key, val in sample_args.items():
            setattr(sample, key, val)

        # regenerate report
        sample.set_sequence(
            sample_input.get('sequence'), sample_input.get('filename'))
        sample.generate_reports(
            datetime.now(pytz.utc),
            manually_approved=input_.get('manually_approved', False)
        )
        db.session.commit()

        models.blastdb.makeblastdb_incr()
        return UpdatePatientSample(
            patient=visit.patient,
            updated_patient_visit=visit,
            updated_patient_sample=sample)
