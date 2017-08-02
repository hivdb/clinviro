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

import click
from flask.cli import AppGroup
from flask import current_app as app

from elasticsearch import helpers
from elasticsearch.exceptions import NotFoundError

es = app.es
Patient = app.models.Patient
INDEX = 'patient-index'


@app.cli.command(cls=AppGroup)
def patients():
    """Perform patient index operations."""
    pass


@patients.command()
@click.argument('name', nargs=-1)
def search(name):
    """Search a patient"""
    result = Patient.search(' '.join(name))
    click.echo(
        'Input name hits {} result(s). The first {} was/were returned:\n'
        .format(result['total'], len(result['patients']))
    )
    for pt in result['patients']:
        click.echo(
            'Ptnum={pt.ptnum}: {pt.fullname} (score: {score})'
            .format(pt=pt, score=result['scores'][pt.ptnum])
        )
    click.echo()


@patients.command()
@click.option('--autoremove', is_flag=True)
def create_index(autoremove):
    """Create a new patient index."""
    if autoremove:
        try:
            es.indices.delete(index=INDEX)
        except NotFoundError:
            # ignore if not found
            pass
    es.indices.create(
        index=INDEX,
        body={
            'mappings': {
                'patient': {
                    'properties': {
                        'name': {'type': 'text'}
                    }
                }
            }
        }
    )
    offset = 0
    limit = 200
    while True:
        patients = (
            Patient.query
            .order_by(Patient.ptnum)
            .offset(offset).limit(limit)
            .all())
        if len(patients) == 0:
            break
        actions = [
            {
                '_index': INDEX,
                '_type': 'patient',
                '_id': pt.ptnum,
                '_source': {
                    'name': pt.fullname
                }
            }
            for pt in patients
        ]
        helpers.bulk(es, actions)
        click.echo(
            'Indices created for patients {} - {}.'
            .format(patients[0].ptnum, patients[-1].ptnum)
            if len(patients) > 1 else
            'Indices created for patient {}.'
            .format(patients[0].ptnum)
        )
        if len(actions) < limit:
            break
        offset += len(actions)
