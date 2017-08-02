/**
 * ClinViro
 * Copyright (C) 2017 Stanford HIVDB team.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.

 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

export function parseFasta(raw, fileName) {
  let sequences = [];
  let unnamedNum = 0;
  for (let rawseq of raw.split(/^(?=>)/gm)) {
    let header, size;
    let sequence = [];

    for (let line of rawseq.split(/[\r\n]+/g)) {
      if (line.startsWith('#')) {
        continue;
      }
      else if (line.startsWith('>')) {
        header = header || line.slice(1).trim();
      }
      else {
        sequence.push(line.trim());
      }
    }
    sequence = sequence.join('');
    size = sequence.length;
    if (header === undefined) {
      if (size) {
        header = `${fileName} unamed sample: ${++ unnamedNum}`;
        header = header.trim();
      }
      else {
        // ignore if header and sequence are both empty
        continue;
      }
    }
    sequences.push({header, sequence, size});
  }
  return sequences;
}

export function concatFasta(header, sequence) {
  if (header instanceof Array) {
    return header
    .map(({header, sequence}) => concatFasta(header, sequence))
    .join('\n');
  }
  else {
    return `>${header}\n${sequence}`;
  }
}
