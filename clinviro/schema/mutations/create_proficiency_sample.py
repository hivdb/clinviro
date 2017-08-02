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

from ..proficiency_sample import ProficiencySample

db = app.db
models = app.models


def create_proficiency_sample(input_):
    profsample = models.ProficiencySample(
        name=input_['name'],
        source=input_['source'],
        vnum=input_['vnum'],
        test_code=input_['test_code'],
        notes=input_.get('notes'),
        labnotes=input_.get('labnotes'),
        received_at=input_['received_at'].date(),
        entered_at=datetime.now(pytz.utc))

    # generate report
    profsample.set_sequence(input_['sequence'], input_.get('filename'))
    return profsample


class ProficiencySampleInput:
    name = graphene.String(required=True)
    source = graphene.String(required=True)
    vnum = graphene.String(required=True)
    test_code = graphene.String(required=True)
    sequence = graphene.String()
    filename = graphene.String()
    notes = graphene.String()
    labnotes = graphene.String()
    received_at = DateTime(required=True)


class CreateProficiencySample(graphene.ClientIDMutation):

    Input = ProficiencySampleInput
    proficiency_sample = graphene.Field(ProficiencySample)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, input_, context, info):
        profsample = create_proficiency_sample(input_)
        db.session.add(profsample)
        db.session.flush()
        profsample.generate_reports(profsample.entered_at)
        db.session.commit()
        models.blastdb.makeblastdb_incr()
        return CreateProficiencySample(proficiency_sample=profsample)
