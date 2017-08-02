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
from sqlalchemy_utils import ChoiceType
from depot.fields.sqlalchemy import UploadedFileField

db = app.db


class Report(db.Model):

    __tablename__ = 'tbl_reports'

    STATUS_CHOICES = [
        ('approved', 'approved'),
        ('failed', 'failed'),
        ('pending', 'pending'),
    ]

    CONTENT_TYPES = [
        ('docx', 'docx'),
        ('pdf', 'pdf'),
        ('json', 'json'),
    ]

    id = db.Column(
        db.Integer, primary_key=True, nullable=False, doc='report UID')
    content = db.Column(
        UploadedFileField, doc='content file where the report stored')
    content_type = db.Column(
        ChoiceType(CONTENT_TYPES, db.Unicode(16)), doc='content type')
    status = db.Column(
        ChoiceType(STATUS_CHOICES, db.Unicode(32)), doc='report status')
    created_at = db.Column(
        db.DateTime(timezone=True), doc='Datetime this report get created')
