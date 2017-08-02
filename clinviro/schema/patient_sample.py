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
from graphene_sqlalchemy import SQLAlchemyObjectType
from flask import current_app as app

from .report import Report

db = app.db
models = app.models


class PatientSample(SQLAlchemyObjectType):
    physician_id = graphene.ID(
        description=models.PatientSample.physician_id.doc,
        required=not models.PatientSample.physician_id.nullable)
    clinic_id = graphene.ID(
        description=models.PatientSample.clinic_id.doc,
        required=not models.PatientSample.clinic_id.nullable)
    latest_reports = graphene.List(
        Report, required=False, description='Latest reports (if existing)')
    is_approved = graphene.Boolean(
        description='Is the latest reports got approved or not')

    class Meta:
        model = models.PatientSample
