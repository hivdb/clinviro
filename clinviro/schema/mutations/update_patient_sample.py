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
        collected_at = Date()
        sample = PatientSampleInput(required=True)
        manually_approved = graphene.Boolean()

    patient = graphene.Field(Patient)
    updated_patient_visit = graphene.Field(PatientVisit)
    updated_patient_sample = graphene.Field(PatientSample)

    @staticmethod
    @login_required
    def mutate_and_get_payload(root, info, **input_):
        sample = models.PatientSample.query.get(get_numeric_id(input_['id']))
        visit = sample.visit
        payload = {
            'ptnum': visit.ptnum,
            'patient_visit_id': visit.id,
            'patient_sample_id': sample.id,
            'manually_approved': bool(input_.get('manually_approved')),
            'changed_fields': []
        }
        if 'mrid' in input_ and visit.mrid != input_['mrid']:
            payload['changed_fields'].append({
                'field': 'mrid',
                'old_value': visit.mrid,
                'new_value': input_['mrid']
            })
            visit.mrid = input_['mrid']
        if 'collected_at' in input_ and \
                visit.collected_at != input_['collected_at']:
            payload['changed_fields'].append({
                'field': 'collected_at',
                'old_value': visit.collected_at,
                'new_value': input_['collected_at']
            })
            visit.collected_at = input_['collected_at']

        # update sample
        sample_input = input_['sample']
        sample_args = sample_input_to_args(sample_input)
        for key, val in sample_args.items():
            field = key
            old_value = getattr(sample, key)
            new_value = val
            if field in ('physician', 'clinic'):
                field += '_id'
                old_value = old_value.id
                new_value = new_value.id
            if old_value != new_value:
                payload['changed_fields'].append({
                    'field': field,
                    'old_value': old_value,
                    'new_value': new_value
                })
                setattr(sample, key, val)

        old_naseq = None
        old_filename = None
        naseq = sample_input.get('sequence')
        filename = sample_input.get('filename')
        if sample.sequence:
            old_naseq = sample.sequence.naseq
            old_filename = sample.sequence.filename
        if old_naseq != naseq:
            payload['changed_fields'].append({
                'field': 'sequence_naseq',
                'old_value': old_naseq,
                'new_value': naseq
            })
        if old_filename != filename:
            payload['changed_fields'].append({
                'field': 'sequence_filename',
                'old_value': old_filename,
                'new_value': filename
            })
        # regenerate report
        sample.set_sequence(naseq, filename)
        sample.generate_reports(
            datetime.now(pytz.utc),
            manually_approved=input_.get('manually_approved', False)
        )
        log = models.AuditLog.for_current_user(
            'MODIFY', 'PATIENT_SAMPLE', payload
        )
        db.session.add(log)
        db.session.commit()

        models.blastdb.makeblastdb_incr()
        return UpdatePatientSample(
            patient=visit.patient,
            updated_patient_visit=visit,
            updated_patient_sample=sample)
