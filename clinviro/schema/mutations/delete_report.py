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
from flask import current_app as app
from flask_login import login_required

from ..utils import get_numeric_id
from ..enums import SampleType

db = app.db
models = app.models


class DeleteReport(graphene.ClientIDMutation):

    class Input:
        type = SampleType(required=True)
        uid = graphene.ID(required=True)
        report_ids = graphene.List(graphene.ID, required=True)

    deleted_report_ids = graphene.List(graphene.ID)

    @staticmethod
    @login_required
    def mutate_and_get_payload(root, info, **input_):
        rtype = input_['type']
        uid = get_numeric_id(input_['uid'])
        ids = input_['report_ids']
        if rtype == 'patient_sample':
            sample = models.PatientSample.query.get(uid)
        elif rtype == 'proficiency_sample':
            sample = models.ProficiencySample.query.get(uid)
        else:
            sample = models.PositiveControl.query.get(uid)
        model = models.Report
        reports = model.query.filter(model.id.in_(ids))
        deleted = []
        for report in reports:
            try:
                sample.reports.remove(report)
                db.session.delete(report)  # mark report in `session.deleted`
                deleted.append(report.id)
            except ValueError:
                pass
        log = models.AuditLog.for_current_user(
            'DELETE', 'REPORT',
            payload={
                'sample_type': rtype,
                'sample_id': uid,
                'reports': [{
                    'report_id': r.id,
                    'created_at': r.created_at
                } for r in reports]
            }
        )
        db.session.add(log)
        db.session.commit()
        return DeleteReport(deleted_report_ids=deleted)
