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

from ..patient import Patient
from ..patient_sample import PatientSample
from ..patient_visit import PatientVisit

from .patient_sample_input import PatientSampleInput, sample_input_to_args

db = app.db
models = app.models


def create_patient_sample(patient, mrid, collected_at, sample_input):
    # try get the existing visit
    visit = (db.session
             .query(models.PatientVisit)
             .filter_by(mrid=mrid, patient=patient,
                        collected_at=collected_at)
             .one_or_none())
    if not visit:
        # else create a new one
        visit = models.PatientVisit(
            mrid=mrid,
            patient=patient,
            collected_at=collected_at)
        db.session.add(visit)

    # create new sample
    sample_args = sample_input_to_args(sample_input)
    sample = models.PatientSample(
        entered_at=datetime.now(pytz.utc),
        **sample_args
    )
    visit.samples.append(sample)
    sample.set_sequence(
        sample_input.get('sequence'), sample_input.get('filename'))

    return sample


class CreatePatientVisit(graphene.ClientIDMutation):

    class Input:
        ptnum = graphene.ID(required=True)
        mrid = graphene.String()
        collected_at = Date(required=True)
        sample = PatientSampleInput(required=True)

    updated_patient = graphene.Field(Patient)
    patient_visit = graphene.Field(PatientVisit)
    patient_sample = graphene.Field(PatientSample)

    @staticmethod
    @login_required
    def mutate_and_get_payload(
            root, info, ptnum, mrid, collected_at,
            sample, client_mutation_id=None):
        patient = models.Patient.query.get(ptnum)
        sampleobj = create_patient_sample(
            patient, mrid, collected_at, sample)
        visit = sampleobj.visit

        sampleobj.generate_reports(sampleobj.entered_at)
        db.session.flush()
        log = models.AuditLog.for_current_user(
            'CREATE', 'PATIENT_SAMPLE',
            payload={
                'ptnum': patient.ptnum,
                'patient_visit_id': visit.id,
                'patient_sample_id': sampleobj.id,
                'vnum': sampleobj.vnum,
                'physician': sampleobj.physician.name,
                'clinic': sampleobj.clinic.name,
                'test_code': sampleobj.test_code,
                'amplifiable': sampleobj.amplifiable,
                'collected_at': visit.collected_at,
                'received_at': sampleobj.received_at,
                'entered_at': sampleobj.entered_at
            }
        )
        db.session.add(log)
        db.session.commit()

        models.blastdb.makeblastdb_incr()
        return CreatePatientVisit(
            updated_patient=visit.patient,
            patient_visit=visit,
            patient_sample=sampleobj)
