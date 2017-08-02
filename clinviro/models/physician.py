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

db = app.db


class Physician(db.Model):

    __tablename__ = 'tbl_physicians'
    __table_args__ = (
        db.UniqueConstraint('lastname', 'firstname'),
    )

    id = db.Column(
        db.Integer, primary_key=True, nullable=False,
        doc='physician UID')
    lastname = db.Column(
        db.Unicode(128), index=True, nullable=False,
        doc='physician lastname')
    firstname = db.Column(
        db.Unicode(128), index=True, nullable=False,
        doc='physician firstname')

    @property
    def name(self):
        name = [self.lastname]
        if self.firstname:
            name.append(self.firstname)
        return ', '.join(name)
