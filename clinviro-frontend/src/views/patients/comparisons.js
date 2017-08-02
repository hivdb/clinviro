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

function eqSet(as, bs) {
  // http://stackoverflow.com/a/31129384/2644759
  if (as.size !== bs.size) return false;
  for (let a of as) if (!bs.has(a)) return false;
  return true;
}

function eqMoment(adate, bdate) {
  if (adate || bdate) {
    if (!adate || !bdate || !adate.isSame(bdate)) {
      return false;
    }
  }
  return true;
}

export function isPatientChanged(left, right) {
  for (const key in left) {
    if (key === 'fullname') {
      // we only compares firstname and lastname
      continue;
    }
    else if (key === 'mergedMRIDs') {
      if (Object.keys(left[key]).length ||
          Object.keys(right[key]).length) {
        return true;
      }
    }
    else if (key === 'birthday') {
      if (!eqMoment(left.birthday, right.birthday)) {
        return true;
      }
    }
    else if (key === 'mrids') {
      if (!eqSet(new Set(left.mrids),
                 new Set(right.mrids))) {
        return true;
      }
    }
    else if (left[key] !== right[key]) {
      return true;
    }
  }
  return false;
}

export function isPatientVisitChanged(left, right) {
  if ('lastname' in left) {
    // check the patient infos
    if (left.lastname !== right.lastname) {
      return true;
    }
    if (left.firstname !== right.firstname) {
      return true;
    }
    if (!eqMoment(left.birthday, right.birthday)) {
      return true;
    }
  }
  if (!eqMoment(left.collectedAt, right.collectedAt)) {
    return true;
  }
  const lseq = left.sequence;
  const rseq = right.sequence;
  if (lseq || rseq) {
    if (!lseq || !rseq || lseq.sequence !== rseq.sequence) {
      return true;
    }
  }
  if (!eqMoment(left.receivedAt, right.receivedAt)) {
    return true;
  }
  if (
    left.mrid !== right.mrid ||
    left.vnum !== right.vnum ||
    left.testCode !== right.testCode ||
    left.isAmplifiable !== right.isAmplifiable ||
    left.physicianId !== right.physicianId ||
    left.clinicId !== right.clinicId ||
    left.notes !== right.notes ||
    left.labnotes !== right.labnotes ||
    left.manuallyApproved != right.manuallyApproved
  ) {
    return true;
  }
  return false;
}
