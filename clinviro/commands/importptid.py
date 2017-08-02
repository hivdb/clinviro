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

import csv
import click
from flask import current_app as app

db = app.db
models = app.models


@app.cli.command()
@click.argument('input', type=click.File('r'))
def importptid(input):
    reader = csv.DictReader(input)
    for ptmap in reader:
        patient = models.Patient.query.get(ptmap['ptnum'])
        if patient.hivdb_ptid:
            raise Exception(
                'Cannot change PtID of patient {} from {} to {}'
                .format(patient.ptnum, patient.hivdb_ptid, ptmap['ptid'])
            )
        patient.hivdb_ptid = ptmap['ptid']
    db.session.commit()
