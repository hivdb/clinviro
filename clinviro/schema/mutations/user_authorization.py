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
from flask_login import login_user, logout_user


class LoginUser(graphene.ClientIDMutation):

    class Input:
        email = graphene.String(required=True)
        password = graphene.String(required=True)

    user_authenticated = graphene.Boolean()

    @classmethod
    def mutate_and_get_payload(cls, input_, context, info):
        user = (app.models.User.query
                .filter_by(email=input_['email'])
                .one_or_none())
        if not user:
            return LoginUser(user_authenticated=False)
        prevhash = user.password.hash
        if user.password != input_['password']:
            return LoginUser(user_authenticated=False)
        login_user(user)
        if prevhash != user.password.hash:
            app.db.session.commit()
        return LoginUser(user_authenticated=True)


class LogoutUser(graphene.ClientIDMutation):

    user_authenticated = graphene.Boolean()

    @classmethod
    def mutate_and_get_payload(cls, input_, context, info):
        logout_user()
        return LogoutUser(user_authenticated=False)
