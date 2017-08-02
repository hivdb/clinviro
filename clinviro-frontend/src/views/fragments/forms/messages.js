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

import PropTypes from 'prop-types';
import React from 'react';
import style from './style.css';
import capitalize from 'underscore.string/capitalize';

export const messagesShape = PropTypes.arrayOf(
  PropTypes.shape({
    text: PropTypes.node.isRequired,
    level: PropTypes.oneOf(['error', 'warning', 'info'])
  }).isRequired
);

export function checkMessagesOnSubmit(messages, success, failure) {
  if (messagesHaveLevel(messages, 'error')) {
    failure();
    window.scroll(0, 0);
  }
  else if (messagesHaveLevel(messages, 'warning')) {
    if (confirm('There are unsolved warning messages. ' +
                'Please confirm to ignore them.')) {
      success();
    }
  }
  else {
    success();
  }
}

export function messagesHaveLevel(messages, level) {
  return !!messages.find(m => m.level === level);
}

export default class Messages extends React.Component {

  static propTypes = {
    messages: messagesShape.isRequired
  }

  render() {
    const {messages} = this.props;
    return (
      <ul className={style.messages}>
        {messages.map(({text, level}, idx) => (
          <li key={idx} className={level === 'info' ? null : style.warning}>
            {level === 'info' ? null : `${capitalize(level)}: `}
            {text}
          </li>
        ))}
      </ul>
    );
  }
}
