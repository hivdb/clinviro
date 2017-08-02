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

import XRegExp from 'xregexp';

const strictPattern = XRegExp("^(Ma?c)?\\p{Lu}[\\p{Ll}]*(['-]\\p{Lu}[\\p{Ll}]*)*$");

export const messages = {
  strictlyTestName: {
    text: ('Please rewrite the name in recommended ' +
           'format, for example: "Doe, John P".'),
    level: 'warning'
  }
};

export function strictlyTestName(fullname, required = false) {
  if (!fullname.trim()) {
    return !required;
  }
  const names = fullname.split(/[, ]+/g);
  for (const name of names) {
    if (!name) {
      continue;
    }
    if (!strictPattern.test(name)) {
      return false;
    }
  }
  return true;
}
