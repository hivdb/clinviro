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

from ..clinic import Clinic

db = app.db
models = app.models


class CreateClinic(graphene.ClientIDMutation):

    class Input:
        name = graphene.String(required=True)

    clinic = graphene.Field(Clinic)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, input_, context, info):
        new_clinic = models.Clinic(
            name=input_['name'],
            is_active=True
        )
        db.session.add(new_clinic)
        db.session.commit()
        return CreateClinic(clinic=new_clinic)
