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

function eqMoment(adate, bdate) {
  if (adate || bdate) {
    if (!adate || !bdate || !adate.isSame(bdate)) {
      return false;
    }
  }
  return true;
}

export function isProficiencySampleChanged(left, right) {
  for (const key in left) {
    if (key === 'sequence') {
      const lseq = left.sequence;
      const rseq = right.sequence;
      if (lseq || rseq) {
        if (!lseq || !rseq || lseq.sequence !== rseq.sequence) {
          return true;
        }
      }
    }
    else if (key === 'receivedAt') {
      if (!eqMoment(left.receivedAt, right.receivedAt)) {
        return true;
      }
    }
    else if (left[key] !== right[key]) {
      return true;
    }
  }
  return false;
}
