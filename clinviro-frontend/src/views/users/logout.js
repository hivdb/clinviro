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

import React from 'react';
import Relay from 'react-relay/classic';
import FaSignOut from 'react-icons/lib/fa/sign-out';

import {LogoutUser as LogoutUserMutation} from '../../mutations';
import ErrorBox from '../errors/error-box';

class LogoutUser extends React.Component {

  componentWillMount() {
    const onSuccess = response => {
      const {userAuthenticated} = response.logoutUser;
      window.__userAuthenticated = userAuthenticated;
    };
    this.props.relay.commitUpdate(
      new LogoutUserMutation(),
      {onSuccess}
    );
  }

  handleClose(e) {
    e.preventDefault();
  }

  render() {
    return (
      <ErrorBox
       IconComponent={FaSignOut}>
        You have been signed out of this account.
        Please close this window.
      </ErrorBox>
    );
  }

}

export default Relay.createContainer(LogoutUser, {
  fragments: {}
});
