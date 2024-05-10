# ClinViro
# Copyright (C) 2024 Stanford HIVDB team.
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

# -*- coding: utf-8 -*-
import textwrap
from copy import deepcopy
from texttable import Texttable
from flask import render_template

from .abstract import AbstractGenerator

LINE_WIDTH = 80


class TXTGenerator(AbstractGenerator):

    content_type = 'txt'
    mimetype = 'text/plain'

    def textwrap(
        self,
        text: str,
        width: int = LINE_WIDTH,
        subsequent_indent: int = 0
    ) -> str:
        return textwrap.fill(
            text, width, subsequent_indent=' ' * subsequent_indent)

    def table_mutation_types(self, genedr):
        table = Texttable(LINE_WIDTH)
        table.set_deco(Texttable.HEADER)
        type_labels = {
            muttype['name']: muttype['label']
            for muttype in genedr['mutation_types']
        }
        table.header(['Gene', 'Mutation', 'Type'])
        for mut in genedr['mutations']:
            row = [
                genedr['gene'],
                mut['text'],
                type_labels.get(mut['type'], mut['type'])
            ]
            table.add_row(row)
        return table.draw()

    def table_drug_levels(self, drug_levels):
        table = Texttable(LINE_WIDTH)
        table.set_deco(Texttable.HEADER)
        table.header(['Drug', 'Level'])
        for dlevel in drug_levels:
            # len(cols) == 2
            row = [
                '{fullname} ({name})'.format(**dlevel['drug']),
                dlevel['level_text']
            ]
            table.add_row(row)
        return table.draw()

    def table_mutation_scores(self, dcresult):
        dcname = dcresult['drug_class']['name']
        drug_levels = dcresult['drug_levels']
        table = Texttable()
        table.set_deco(Texttable.HEADER)
        table.header([dcname] + [dlevel['drug']['name']
                                 for dlevel in drug_levels])
        total = {}
        for mutscore in dcresult['mutation_scores']:
            # len(cols) == len(drugs) + 1
            row = []
            row.append(' + '.join(mutscore['mutations']))
            for dlevel in drug_levels:
                dname = dlevel['drug']['name']
                score = mutscore['drug_scores'][dname]
                row.append(score)
                total[dname] = total.setdefault(dname, 0) + score
            table.add_row(row)
        if len(dcresult['mutation_scores']) != 1:
            row = []
            row.append('Total')
            for dlevel in drug_levels:
                row.append(total.get(dlevel['drug']['name'], 0))
            table.add_row(row)
        return table.draw()

    def table_prev_sequences(self, gene, prevseqs):
        table = Texttable()
        table.set_deco(Texttable.HEADER)
        table.header([
            'Date', 'Accession #', 'Distance %', '{} Mutations'.format(gene)
        ])
        table.set_cols_dtype(['t'] * 4)
        for seq in prevseqs:
            # len(cols) == 4
            table.add_row([
                seq['collected_at'],
                seq['vnum'],
                '%0.2f' % (seq['distance'] * 100),
                seq['mutations']
            ])
        return table.draw()

    def render(self, prepared_data):
        prepared_data = deepcopy(prepared_data)

        return render_template(
            'txt_report.markdown.jinja2',
            textwrap=self.textwrap,
            table_mutation_types=self.table_mutation_types,
            table_drug_levels=self.table_drug_levels,
            table_mutation_scores=self.table_mutation_scores,
            table_prev_sequences=self.table_prev_sequences,
            **prepared_data).encode('utf-8')
