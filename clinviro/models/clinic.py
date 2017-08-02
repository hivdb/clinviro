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


class Clinic(db.Model):

    __tablename__ = 'tbl_clinics'

    id = db.Column(
        db.Integer, primary_key=True, nullable=False,
        doc='clinic UID')
    name = db.Column(
        db.Unicode(128), unique=True, nullable=False,
        doc='clinic name')
    canonical_id = db.Column(
        db.Integer, db.ForeignKey('tbl_clinics.id'),
        index=True, nullable=True)
    is_active = db.Column(
        db.Boolean(), default=True, nullable=False,
        doc='true if this record active, else not')

    canonical = db.relationship(
        'Clinic', remote_side=[id], back_populates='aliases',
        doc=('canonical clinic. The record is an alias of another clinic '
             'record if this field is present'))
    aliases = db.relationship(
        'Clinic', remote_side=[canonical_id], back_populates='canonical',
        doc='aliases of this clinic record')
