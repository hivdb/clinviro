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

from flask import current_app as app
from sqlalchemy_utils import EmailType, PasswordType

db = app.db


class User(db.Model):

    __tablename__ = 'tbl_users'

    id = db.Column(
        db.Integer, primary_key=True, nullable=False,
        doc='user unique identifier (UUID)')
    email = db.Column(
        EmailType, unique=True, nullable=False,
        doc='user email')
    password = db.Column(
        PasswordType(
            schemes=[
                'pbkdf2_sha512',
                'des_crypt'
            ],
            deprecated=['des_crypt']
        ), nullable=False,
        doc='user password (hashed)')
    created_at = db.Column(
        db.DateTime(timezone=True), nullable=False, index=True,
        doc='date and time this user was created')

    @property
    def is_active(self):
        return True

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return True

    def get_id(self):
        return str(self.id)
