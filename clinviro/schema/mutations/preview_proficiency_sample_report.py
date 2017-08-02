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
from flask_login import login_required
from flask import current_app as app

from .create_proficiency_sample import (create_proficiency_sample,
                                        ProficiencySampleInput)

db = app.db
models = app.models


class PreviewProficiencySampleReport(graphene.ClientIDMutation):

    Input = ProficiencySampleInput
    data = graphene.types.json.JSONString()

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, input_, context, info):
        with db.session.no_autoflush:
            profsample = create_proficiency_sample(input_)
            json_report = profsample.generate_reports(
                profsample.entered_at, return_json_only=True)
            db.session.rollback()

            return PreviewProficiencySampleReport(data=json_report)
