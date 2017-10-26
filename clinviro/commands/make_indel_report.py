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

import sys
import click
import click_datetime
import pytz
from flask import current_app as app

db = app.db
models = app.models

CURRENT_TIMEZONE = pytz.timezone('US/Pacific')


@app.cli.command()
@click.option('--start-date', prompt=True,
              type=click_datetime.Datetime('%Y-%m-%d'))
@click.option('--stop-date', prompt=True,
              type=click_datetime.Datetime('%Y-%m-%d'))
@click.argument('output', type=click.File('w'))
def make_indel_report(start_date, stop_date, output):
    start = start_date.replace(tzinfo=CURRENT_TIMEZONE)
    stop = stop_date.replace(tzinfo=CURRENT_TIMEZONE)
    psm = models.PatientSample
    pvm = models.PatientVisit
    samples = psm.query.filter(
        psm.visit.has(db.between(pvm.collected_at, start, stop)),
        psm.amplifiable.is_(True)
    ).options(db.joinedload(psm.visit).joinedload(pvm.patient)).all()
    output.write('Ptnum\tName\tMRN\tCollectDate\tVNum\tTestCode\tIndels\n')
    output.flush()
    print('Examing {} samples...'.format(len(samples)))
    count = 0
    for sample in samples:
        # TODO: this can be much faster if retrieve sierra result in batches
        data = sample.sierra_result['data']
        indels = []
        for muts in data['drugResistance'][0]['mutationsByTypes']:
            muts = muts['mutations']
            for mut in muts:
                if mut['isIndel']:
                    indels.append(mut['text'])
        if indels:
            output.write(
                ('\t'.join(['{}'] * 7) + '\n')
                .format(
                    sample.visit.patient.ptnum,
                    sample.visit.patient.fullname,
                    sample.visit.mrid,
                    sample.visit.collected_at,
                    sample.vnum,
                    sample.test_code,
                    ','.join(indels)))
            output.flush()
        count += 1
        if count % 10 == 0:
            print('.', end='')
            sys.stdout.flush()
    print(' done')
