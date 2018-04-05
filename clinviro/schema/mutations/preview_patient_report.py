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
from graphene.types.datetime import Date
from flask_login import login_required
from flask import current_app as app

from .patient_sample_input import PatientSampleInput
from .create_patient_visit import create_patient_sample

db = app.db
models = app.models


class PreviewPatientReport(graphene.ClientIDMutation):

    class Input:
        ptnum = graphene.ID(required=False)
        lastname = graphene.String(required=True)
        firstname = graphene.String(required=True)
        birthday = Date(required=True)
        mrid = graphene.String()
        collected_at = Date(required=True)
        sample = PatientSampleInput(required=True)

    data = graphene.types.json.JSONString()

    @staticmethod
    @login_required
    def mutate_and_get_payload(root, info, **input_):
        with db.session.no_autoflush:
            if input_.get('ptnum'):
                patient = models.Patient.query.get(input_['ptnum'])
            else:
                patient = models.Patient(
                    ptnum=-0xff,
                    created_at=datetime.now(pytz.utc)
                )
            for key in ('lastname', 'firstname', 'birthday'):
                setattr(patient, key, input_[key])
            mrid = input_.get('mrid')
            if mrid and all(mc.mrid != mrid for mc in patient.medical_records):
                patient.medical_records.append(
                    models.MedicalRecord(mrid=input_['mrid'])
                )
            sample = create_patient_sample(
                patient, input_['mrid'],
                input_['collected_at'], input_['sample'])
            json_report = sample.generate_reports(
                    sample.entered_at, return_json_only=True)
            db.session.rollback()

            return PreviewPatientReport(data=json_report)
