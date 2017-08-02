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

from ..positive_control import PositiveControl
from ...models.common import SPECIMEN_TYPE_CHOICES

db = app.db
models = app.models


class CreatePositiveControl(graphene.ClientIDMutation):

    class Input:
        note = graphene.String(required=True)
        lot_number = graphene.String(required=True)
        test_code = graphene.String(required=True)
        specimen_type = graphene.Enum.from_enum(
            SPECIMEN_TYPE_CHOICES)(required=True)
        sequence = graphene.String(required=True)
        filename = graphene.String()
        labnotes = graphene.String()

    positive_control = graphene.Field(PositiveControl)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, input_, context, info):
        posctl = models.PositiveControl(
            note=input_['note'],
            lot_number=input_['lot_number'],
            test_code=input_['test_code'],
            specimen_type=input_['specimen_type'],
            labnotes=input_.get('labnotes'),
            entered_at=datetime.now(pytz.utc))
        db.session.add(posctl)

        # generate report
        posctl.set_sequence(input_['sequence'], input_.get('filename'))
        db.session.flush()
        posctl.generate_reports(posctl.entered_at)
        db.session.commit()
        models.blastdb.makeblastdb_incr()
        return CreatePositiveControl(positive_control=posctl)
