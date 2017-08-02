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

from ..physician import Physician

db = app.db
models = app.models


class CreatePhysician(graphene.ClientIDMutation):

    class Input:
        lastname = graphene.String(required=True)
        firstname = graphene.String(required=True)

    physician = graphene.Field(Physician)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, input_, context, info):
        new_physician = models.Physician(
            lastname=input_['lastname'],
            firstname=input_['firstname']
        )
        db.session.add(new_physician)
        db.session.commit()
        return CreatePhysician(physician=new_physician)
