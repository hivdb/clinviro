# ClinViro
# Copyright (C) 2018 Stanford HIVDB team.
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
from flask import current_app as app

db = app.db
models = app.models


QUERY_SEQUENCE_ANALYSIS_SUBTYPE_ONLY = """
inputSequence {
  header
}
bestMatchingSubtype {
  displayWithoutDistance
}
"""


def yield_sequences_chunk(chunksize):
    model = models.Sequence
    sequences = model.query.order_by(model.id).yield_per(chunksize)
    chunk = []
    for seq in sequences:
        chunk.append(seq)
        if len(chunk) == chunksize:
            yield chunk
            chunk = []
    if chunk:
        yield chunk


@app.cli.command()
def update_subtypes():
    chunksize = 200
    sierra = models.sierra
    total = 0
    for chunk in yield_sequences_chunk(chunksize):
        print(total)
        total += len(chunk)
        input_sequences = [{
            'header': str(seq.id),
            'sequence': seq.naseq
        } for seq in chunk]
        results = sierra.align_sequences(
            input_sequences, QUERY_SEQUENCE_ANALYSIS_SUBTYPE_ONLY)
        for seq, result in zip(chunk, results):
            if str(seq.id) != result['inputSequence']['header']:
                raise RuntimeError(
                    "Sequence doesn't match: {} vs {}; "
                    "it might be a Sierra error".format(
                        str(seq.id),
                        result['inputSequence']['header']
                    )
                )
            try:
                seq.subtype = \
                    result['bestMatchingSubtype']['displayWithoutDistance']
                db.session.flush()
            except KeyError:
                print('Sequence {} seems not aligned correctly'.format(seq.id),
                      file=sys.stderr)
    db.session.commit()
