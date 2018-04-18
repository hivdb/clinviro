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
from flask_login import login_required
from flask import current_app as app

from ..proficiency_sample import ProficiencySample
from .proficiency_sample_input import (ProficiencySampleInput,
                                       sample_input_to_args)

db = app.db
models = app.models


def create_proficiency_sample(input_):
    sample_args = sample_input_to_args(input_)
    profsample = models.ProficiencySample(
        entered_at=datetime.now(pytz.utc),
        **sample_args
    )

    # generate report
    profsample.set_sequence(input_['sequence'], input_.get('filename'))
    return profsample


class CreateProficiencySample(graphene.ClientIDMutation):

    Input = ProficiencySampleInput
    proficiency_sample = graphene.Field(ProficiencySample)

    @staticmethod
    @login_required
    def mutate_and_get_payload(root, info, **input_):
        profsample = create_proficiency_sample(input_)
        db.session.add(profsample)
        db.session.flush()
        profsample.generate_reports(profsample.entered_at)
        log = models.AuditLog.for_current_user(
            'CREATE', 'PROFICIENCY_SAMPLE',
            payload={
                'proficiency_sample_id': profsample.id,
                'name': profsample.name,
                'source': profsample.source,
                'vnum': profsample.vnum,
                'test_code': profsample.test_code,
                'received_at': profsample.received_at,
                'entered_at': profsample.entered_at
            }
        )
        db.session.add(log)
        db.session.commit()
        models.blastdb.makeblastdb_incr()
        return CreateProficiencySample(proficiency_sample=profsample)
